import fs from "fs"
import crypto from "crypto"

import glob from "fast-glob"
import mime from "mime-types"

import { aws } from "#env"
import { logging } from "#internal"

async function amap(source, map) {
    const result = []
    for (const item of source) {
        result.push(
            await map(item)
        )
    }
    return result
}
const md5 = file => new Promise(
    (resolve) => {
        const output = crypto.createHash("md5")
        const input = fs.createReadStream(file)

        output.once(
            "readable",
            () => resolve(
                output.read().toString("hex")
            )
        )
        input.pipe(output)
    }
)
const fileMap = files => files.reduce(
    (mapping, info) => {
        mapping[info.name] = info.hash
        return mapping
    },
    {}
)

const syncFiles = async ({name, dir, prefix = ""}) => {
    console.log("Scanning bucket")
    const list = await aws.s3.listObjectsV2({
        Bucket: name,
        Prefix: prefix,
    })
    const dest = fileMap(
        (list.Contents ?? []).map(
            item => ({
                name: item.Key.slice(prefix.length),
                hash: item.ETag.slice(1, -1)
            })
        )
    )

    console.log("Scanning local files")
    const sourceList = await glob(
        "**/*",
        {
            onlyFiles: true,
            cwd: dir,
        }
    )
    const source = fileMap(
        await amap(
            sourceList,
            async name => {
                return {
                    name,
                    hash: await md5(`${dir}/${name}`)
                }
            }
        )
    )

    console.log("Diffing lists")
    const sourceFiles = Object.keys(source)
    const s3Files = Object.keys(dest)

    const remove = s3Files.filter(
        file => sourceFiles.includes(file) === false
    )

    const update = sourceFiles.filter(
        file => source[file] !== dest[file]
    )

    if (update.length === 0 && remove.length === 0) {
        console.log("No changes to sync")
        return
    }

    console.group("Syncing files")
    for (const file of update) {
        console.log("Updating", file)
        await aws.s3.putObject({
            Bucket: name,
            Key: `${prefix}${file}`,
            Body: fs.readFileSync(`${dir}/${file}`),
            ContentType: mime.lookup(file) || "application/octet-stream",
        })
    }
    for (const file of remove) {
        console.log("Removing", file)
        await aws.s3.deleteObject({
            Bucket: name,
            Key: `${prefix}${file}`,
        })
    }
    console.groupEnd()
}

export default logging(
    () => "Sync files",
    syncFiles
)
