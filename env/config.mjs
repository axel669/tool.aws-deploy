import fs from "fs/promises"
import yaml from "yaml"
import frontMatter from "yaml-front-matter"

import joker from "@axel669/joker"

const envName = process.argv[2]

if (envName === undefined) {
    console.log("env file not provided (or '-')")
    process.exit(1)
}
if (process.argv.length < 4) {
    console.log("command not provided")
    process.exit(1)
}

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
const hydration = (env) =>
    function (_, value) {
        if (typeof value === "string") {
            const interpolated = value.replace(
                /\$\$\{([a-zA-Z0-9_\-\$\.]+)\}/g,
                (_, name) => {
                    return env[name] ?? process.env[name]
                }
            )
            if (interpolated === "undefined") {
                return undefined
            }
            return interpolated
        }
        return value
    }

const configText = await fs.readFile("aws-deploy.yml", "utf8")

const envInfo = frontMatter.loadFront(configText)

process.env["env"] = envName
const envHydrate = hydration({})
const env = Object.fromEntries(
    flat(envName === "-" ? {} : envInfo[envName])
        .map(
            ([key, value]) => [key, envHydrate(null, value)]
        )
)

const config = yaml.parse(
    envInfo.__content,
    hydration(env)
)

const suffix = (action) => {
    const { alias, version } = action
    if (version !== undefined || alias !== undefined) {
        return `:${version ?? alias}`
    }
    return ""
}

const fname = (action) => {
    if (action.type !== "function") {
        return null
    }
    const { func } = action

    if (func.startsWith("@") === true) {
        return func.slice(1)
    }

    const { lambda } = config
    return `${lambda[func].name}${suffix(action)}`
}

const validate = joker.validator({
    itemName: "config",
    root: {
        "?profile": "string",
        "region": "string",
        "?tags{}": "string",
        "?lambda{}": {
            name: "string",
            dir: "string",
            runtime: "string",
            "?memory": "int",
            "?timeout": "int",
            "?handler": "string",
            "?env{}": "string",
        },
        "?apig{}": {
            name: "string",
            stage: "string",
            "?auth{}": {
                type: "string",
                func: "string",
                "idSource[]": "string",
                "?cache": "int",
            },
            "actions{}": {
                "joker.type": "conditional",
                condition: (item) => item.type,
                "http": {
                    "url": "string",
                    "method": "string",
                },
                "function": {
                    func: "string",
                    "?alias": "string"
                }
            },
            "routes{}": {
                "action": "string",
                "?auth": "string",
            },
            "?stageVars{}": {
                "joker.type": "string",
                format: /^[A-Za-z0-9-._~:/?#&=, ]*$/,
            },
            "?cors": {
                "?credentials": "bool",
                "?maxAge": "int",
                "?expose[]": "string",
                "?headers[]": "string",
                "?methods[]": "string",
                "?origins[]": "string",
            }
        },
        "?s3{}": {
            name: "string",
            "?dir": "string",
            "?prefix": {
                "joker.type": "string",
                format: /^([a-zA-Z0-9_\$\- \.]+\/)+$/
            },
            "?blockPublic": {
                "?acl": "bool",
                "?policy": "bool"
            },
            "?policy": "array",
            "?website": {
                "index": "string",
                "?error": "string"
            }
        },
    }
})

const configValid = validate(config)

if (configValid !== true) {
    configValid.forEach(
        result => console.log(result.message)
    )
    process.exit(2)
}

if (process.argv[3] === "validate-config") {
    console.log(
        JSON.stringify(config, null,  2)
    )
    console.log("Configuration is valid")
    process.exit(0)
}

for (const target of process.argv.slice(4)) {
    const [svc, id] = target.split(":")
    if (config[svc] === undefined) {
        console.log(`${svc} is not defined in config file.`)
        process.exit(0)
    }
    if (config[svc][id] === undefined) {
        console.log(`Resource ${id} is not defined in ${svc} config section.`)
        process.exit(0)
    }
}

for (const [key, func] of Object.entries(config.lambda ?? {})) {
    func.key = key
}
for (const [key, api] of Object.entries(config.apig ?? {})) {
    api.key = key
    for (const [key, action] of Object.entries(api.actions)) {
        action.lname = fname(action)
        action.key = key
    }
    for (const [key, route] of Object.entries(api.routes)) {
        route.key = key
    }
    for (const [key, auth] of Object.entries(api.auth ?? {})) {
        auth.lname = fname(auth)
        auth.key = key
    }
}

config.awsTags = Object.fromEntries(
    Object.entries(config.tags)
    .map(
        ([key, value]) => [
            `aws-deploy-${key}`,
            value
        ]
    )
)

export default config
