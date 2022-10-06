#! /usr/bin/env node

import path from "node:path"
import url from "node:url"

import glob from "fast-glob"

import { config } from "#env"

const [command, ...targets] = process.argv.slice(3)

global.implement = (feature) => console.error(
    new Error(`Implement: ${feature}`)
)

const root = path.dirname(
    url.fileURLToPath(import.meta.url)
)
const libFiles = await glob(
    ["*/*.mjs", "!$*/*.mjs"],
    { cwd: path.resolve(root, "lib") }
)
const cmds = Object.fromEntries(
    await Promise.all(
        libFiles.map(
            async (filename) => {
                const lib = await import(`./lib/${filename}`)
                const key = filename.replace(".mjs", "").replace("/", ".")
                return [key, lib.default]
            }
        )
    )
)

/*
    aws-deploy env.yml deploy all
    aws-deploy env.yml deploy lambda:main s3:site
    aws-deploy env.yml remove all
    aws-deploy env.yml remove s3:site
    aws-deploy env.yml remove diff
*/

const readConfig = {
    lambda: (id) => config.functions[id],
    s3: (id) => config.buckets[id],
    apig: (id) => ({ ...config.apis[id], resID: id }),
}
const deploy = async (target) => {
    const [type, id] = target.split(":")
    const item = readConfig[type](id)
    await cmds[`${type}.deploy`](item)
}
const remove = async (target) => {
    const [type, id] = target.split(":")
    const item = readConfig[type](id)
    await cmds[`${type}.remove`](item)
}
const commands = {
    deploy: async (targetList) => {
        if (targetList.length === 0) {
            return
        }
        const full = targetList[0] === "all"
        const targets =
            (full === true)
            ? config.deployment.resources
            : targetList
        config.full = full
        for (const target of targets) {
            await deploy(target)
        }
    },
    remove: async (targetList) => {
        for (const target of targetList) {
            await remove(target)
        }
    },
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

try {
    await commands[command](targets)
}
catch (err) {
    console.error(err)
}
