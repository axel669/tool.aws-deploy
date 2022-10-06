import fs from "fs/promises"
import yaml from "yaml"

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
    const { prefix, functions } = config
    return `${prefix}${functions[func].name}${suffix(action)}`
}

for (const [key, func] of Object.entries(config.functions ?? {})) {
    func.lname = `${config.prefix}${func.name}`
    func.key = key
}
for (const [key, api] of Object.entries(config.apis ?? {})) {
    api.key = key
    for (const [key, action] of Object.entries(api.integrations)) {
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
