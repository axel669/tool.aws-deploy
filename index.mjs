#! /usr/bin/env node

import fs from "fs/promises"

import yaml from "yaml"
import Service from "./internal/api.mjs"
import cmds from "./cmd/cmds.mjs"

const [, , envFile, command, ...targets] = process.argv

const flat = (obj, parent = "") =>
    Object.entries(obj)
    .reduce(
        (list, [key, value]) => {
            const name = `${parent}.${key}`
            if (typeof value === "object") {
                list.push(
                    ...flat(value, name)
                )
                return list
            }

            list.push([name, value])
            return list
        },
        []
    )

const env = Object.fromEntries(
    flat(
        (envFile === "-")
            ? {}
            : yaml.parse(
                await fs.readFile(envFile, "utf8")
            )
    )
)

const config = yaml.parse(
    await fs.readFile("aws-deploy.yml", "utf8"),
    function (key, value) {
        if (typeof value === "string" && value.startsWith("$$") === true) {
            const name = value.slice(2)
            if (env.hasOwnProperty(name) === true) {
                return env[name]
            }
            return process.env[name]
        }
        return value
    }
)

const deployType = {
    lambda: async (id, config) => {
        const funcInfo = config.functions[id]
        await cmds.setup.lambda(svc, config, funcInfo)
        await cmds.deploy.lambda(svc, config, funcInfo)
    },
    s3: async (id, config) => {
        const bucketInfo = config.buckets[id]
        await cmds.deploy.s3(svc, config, bucketInfo)
    },
    api: async (id, config) => {
        const bucketInfo = config.apis[id]
        await cmds.deploy.api(svc, config, bucketInfo)
    },
}
const commands = {
    setup: async () => {
        const functions = Object.values(config.functions ?? {})
        const buckets = Object.values(config.buckets ?? {})

        for (const funcInfo of functions) {
            await cmds.setup.lambda(svc, config, funcInfo)
        }
        for (const bucketInfo of buckets) {
            await cmds.setup.s3(svc, config, bucketInfo)
        }
    },
    "dev-deploy": async () => {
        config.full = false
        for (const target of targets) {
            const [type, id] = target.split(":")
            await deployType[type](id, config)
        }
    },
    deploy: async () => {
        config.full = true
        for (const target of config.deployment.resources) {
            const [type, id] = target.split(":")
            await deployType[type](id, config)
        }
    }
}

if (command === "help") {
    console.log(
        Object.keys(commands)
    )
    process.exit(0)
}

if (commands.hasOwnProperty(command) === false) {
    console.log(`${command} is not a valid command`)
    process.exit(0)
}

const svc = await Service({
    region: config.region,
    profile: config.profile ?? "default"
})

commands[command](svc, config)
