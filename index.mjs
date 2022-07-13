#! /usr/bin/env node

import fs from "fs/promises"

import yaml from "yaml"
import Service from "./internal/api.mjs"
import cmds from "./cmd/cmds.mjs"
// import deployLambda from "./deploy/lambda.mjs"
// import deployS3 from "./deploy/s3.mjs"

const [, , command, ...targets] = process.argv

const config = yaml.parse(
    await fs.readFile("aws-deploy.yml", "utf8"),
    function (key, value) {
        if (typeof value === "string" && value.startsWith("$$") === true) {
            return process.env[value.slice(2)]
        }
        return value
    }
)

const deployType = {
    func: async (id) => {
        const funcInfo = config.functions[id]
        await cmds.deploy.lambda(svc, config, funcInfo)
    }
}
const commands = {
    setup: async () => {
        for (const funcInfo of Object.values(config.functions)) {
            await cmds.setup.lambda(svc, config, funcInfo)
        }
    },
    deploy: async () => {
        for (const target of targets) {
            const [type, id] = target.split(":")
            await deployType[type](id)
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

const svc = await Service({
    region: config.region,
    profile: config.profile ?? "default"
})

commands[command](svc, config)

// const types = {
//     async func(id, config, full) {
//         await deployLambda(config, config.functions[id], full)
//     },
//     async api() {
//     },
//     async s3(id, config) {
//         await deployS3(config, config.buckets[id])
//     }
// }

// async function deployTargets(config, targets, full) {
//     for (const target of targets) {
//         const [type, id] = target.split(":")
//         await types[type](id, config, full)
//     }
// }

// async function deploy(config, targets) {
//     if (targets.length === 0) {
//         console.log("Deployment targets not spicified")
//         return
//     }

//     if (targets[0] === "full") {
//         await deployTargets(config, config.deployment, true)
//         return
//     }

//     await deployTargets(config, targets, false)
// }

// deploy(config, targets)
