#! /usr/bin/env node

import { config, state, svc } from "#env"
import deployFuncs from "./env/deploy-funcs.mjs"

const [command, ...targets] = process.argv.slice(3)

const readConfig = {
    lambda: (id) => config.functions[id],
    s3: (id) => config.buckets[id],
    apig: (id) => ({ ...config.apis[id], resID: id }),
}
const deploy = async (target) => {
    const [type, id] = target.split(":")
    const item = readConfig[type](id)
    await deployFuncs[type](item)
}
const commands = {
    "dev-deploy": async () => {
        config.full = false
        for (const target of targets) {
            await deploy(target)
        }
    },
    deploy: async () => {
        config.full = true
        for (const target of config.deployment.resources) {
            await deploy(target)
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

await commands[command](svc)
console.log("Cleaning up")
await svc.s3.putObject({
    Bucket: config.deployment.bucket,
    Key: "state.json",
    Body: JSON.stringify(state)
})
