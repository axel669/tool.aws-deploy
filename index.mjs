#! /usr/bin/env node

import fs from "fs/promises"

import yaml from "yaml"
import deployLambda from "./deploy/lambda.mjs"

const [, , ...targets] = process.argv

const config = yaml.parse(
    await fs.readFile("aws-deploy.yml", "utf8"),
    function (key, value) {
        if (typeof value === "string" && value.startsWith("$$") === true) {
            return process.env[value.slice(2)]
        }
        return value
    }
)

const types = {
    async func(id, config, full) {
        await deployLambda(config, config.functions[id], full)
    },
}

async function deployTargets(config, targets, full) {
    for (const target of targets) {
        const [type, id] = target.split(":")
        await types[type](id, config, full)
    }
}

async function deploy(config, targets) {
    if (targets.length === 0) {
        console.log("Deployment targets not spicified")
        return
    }

    if (targets[0] === "full") {
        await deployTargets(config, config.deployment, true)
        return
    }

    await deployTargets(config, targets, false)
}

deploy(config, targets)
