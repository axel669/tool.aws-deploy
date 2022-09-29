#! /usr/bin/env node

import fs from "fs/promises"
import { Response } from "node-fetch"

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
        await cmds.setup.s3(svc, config, bucketInfo)
        await cmds.deploy.s3(svc, config, bucketInfo)
    },
    api: async (id, config) => {
        const apiInfo = {...config.apis[id], resID: id}
        await cmds.setup.apig(svc, config, apiInfo)
        await cmds.deploy.apig(svc, config, apiInfo)
    },
}
const commands = {
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

const s3State = await svc.s3.getObject({
    Bucket: config.deployment.bucket,
    Key: "state.json",
})
config.state =
    (s3State === null)
    ? {}
    : await new Response(s3State.Body).json()

config.state.api = config.state.api ?? {}
config.state.lambda = config.state.lambda ?? {}
config.state.s3 = config.state.s3 ?? {}

await commands[command](svc, config)
console.log("Cleaning up")
await svc.s3.putObject({
    Bucket: config.deployment.bucket,
    Key: "state.json",
    Body: JSON.stringify(config.state)
})
