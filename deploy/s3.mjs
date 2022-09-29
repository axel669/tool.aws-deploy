import fs from "fs"
import crypto from "crypto"

import glob from "fast-glob"
import mime from "mime-types"

import { svc } from "#env"
import { policyJSON } from "#internal"
import setup from "./s3/setup.mjs"

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

const syncBucket = async (name, dir) => {
    console.log("Scanning bucket")
    const list = await svc.s3.listObjectsV2({
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

    for (const file of update) {
        console.log("Updating", file)
        await svc.s3.putObject({
            Bucket: name,
            Key: file,
            Body: fs.readFileSync(`${dir}/${file}`),
            ContentType: mime.lookup(file) || "application/octet-stream",
        })
    }
    for (const file of remove) {
        console.log("Removing", file)
        await svc.s3.deleteObject({
            Bucket: name,
            Key: file,
        })
    }
}

const syncPolicy = async (name, policy) => {
    const info = await svc.s3.getBucketPolicy({ Bucket: name })
    const json = policyJSON(...policy)

    if (info.Policy === json) {
        console.log("Policy unchanged")
        return
    }

    if (json === null) {
        console.log("Removing policy")
        await svc.s3.deleteBucketPolicy({ Bucket: name })
        return
    }

    console.log("Updating bucket policy")
    await svc.s3.putBucketPolicy({
        Bucket: name,
        Policy: json
    })
}

const syncWebsite = async (name, website) => {
    const s3site = await svc.s3.getBucketWebsite({ Bucket: name })

    const unchanged = (
        website?.index === s3site?.IndexDocument?.Suffix
        && website?.error === s3site?.ErrorDocument?.Suffix
    )
    if (unchanged === true) {
        console.log("Website unchanged")
        return
    }

    if (website === null) {
        console.log("Removing website")
        await svc.s3.deleteBucketWebsite({ Bucket: name })
        return
    }

    console.log("Updating website")

    const errorConfig =
        (website.error === undefined)
        ? {}
        : {
            ErrorDocument: { Suffix: website.error }
        }
    await svc.s3.putBucketWebsite({
        Bucket: name,
        WebsiteConfiguration: {
            IndexDocument: { Suffix: website.index },
            ...errorConfig,
        }
    })
}

export default async function s3sync(bucket) {
    await setup(bucket)

    const {
        name,
        dir,
        policy = [],
        website = null,
    } = bucket

    console.group(`Deploying s3:${name} (${name})`)

    await syncBucket(name, dir)
    await syncPolicy(name, policy)
    await syncWebsite(name, website)
    console.groupEnd()
}
