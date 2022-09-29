import fs from "fs/promises"
import url from "url"
import path from "path"

const root = path.dirname(
    url.fileURLToPath(import.meta.url)
)

const targets = await fs.readdir(
    path.resolve(root, "deploy")
)
const cmds = {
    setup: {},
    deploy: {},
}
for (const target of targets) {
    const key = target.slice(0, -4)
    const setupLib = await import(
        url.pathToFileURL(
            path.resolve(root, "setup", target)
        )
    )
    const deployLib = await import(
        url.pathToFileURL(
            path.resolve(root, "deploy", target)
        )
    )
    cmds.setup[key] = setupLib.default
    cmds.deploy[key] = deployLib.default
}

export default cmds
