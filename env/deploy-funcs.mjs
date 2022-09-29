import fs from "fs/promises"
import path from "path"
import url from "url"

const root = path.dirname(
    url.fileURLToPath(import.meta.url)
)
const deploySource = path.resolve(root, "..", "deploy")
const files = await fs.readdir(deploySource)

const libs = await Promise.all(
    files
    .filter(
        (file) => file.endsWith(".mjs")
    )
    .map(
        async (file) => {
            const setupLib = await import(
                url.pathToFileURL(
                    path.resolve(deploySource, file)
                )
            )
            return {
                key: file.slice(0, -4),
                func: setupLib.default,
            }
        }
    )
)

export default libs.reduce(
    (libs, {key, func}) => ({
        ...libs,
        [key]: func,
    }),
    {}
)
