import fs from "fs/promises"
import yaml from "yaml"
import { Response } from "node-fetch"

import Service from "#internal"

const envFile = process.argv[2]

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

const svc = await Service({
    region: config.region,
    profile: config.profile ?? "default"
})

const s3State = await svc.s3.getObject({
    Bucket: config.deployment.bucket,
    Key: "state.json",
})
const state =
    (s3State === null)
        ? {}
        : await new Response(s3State.Body).json()

state.api = state.api ?? {}
state.lambda = state.lambda ?? {}
state.s3 = state.s3 ?? {}

export {
    config,
    svc,
    state,
}
