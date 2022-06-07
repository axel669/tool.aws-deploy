import fs from "fs"
import crypto from "crypto"

import { S3 } from "@aws-sdk/client-s3"
import glob from "fast-glob"

async function map(source, map) {
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

export default async function s3sync(config, bucket) {
    const {
        region,
        profile = "default",
    } = config

    const s3 = new S3({
        region,
        profile,
    })

    const {
        name,
        dir,
    } = bucket

    const list = await s3.listObjectsV2({
        Bucket: name,
    })
    const dest = fileMap(
        (list.Contents ?? []).map(
            item => ({
                name: item.Key,
                hash: item.ETag.slice(1, -1)
            })
        )
    )

    const sourceList = await glob(
        "*",
        {
            onlyFiles: true,
            cwd: dir,
        }
    )
    const source = fileMap(
        await map(
            sourceList,
            async name => {
                return {
                    name,
                    hash: await md5(`${dir}/${name}`)
                }
            }
        )
    )

    const sourceFiles = Object.keys(source)
    const s3Files = Object.keys(dest)

    const remove = s3Files.filter(
        file => sourceFiles.includes(file) === false
    )

    const update = sourceFiles.filter(
        file => source[file] !== dest[file]
    )

    for (const file of update) {
        console.log("updating", file)
        await s3.putObject({
            Bucket: name,
            Key: file,
            Body: fs.readFileSync(`source/${file}`)
        })
    }
    for (const file of remove) {
        console.log("removing", file)
        await s3.deleteObject({
            Bucket: name,
            Key: file,
        })
    }

    if (update.length !== 0 || remove.length !== 0) {
        return
    }

    console.log("no changes to sync")
}
