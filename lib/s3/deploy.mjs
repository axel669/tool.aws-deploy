import setup from "./deploy/setup.mjs"

import syncFiles from "./sync/files.mjs"
import syncPolicy from "./sync/policy.mjs"
import syncWebsite from "./sync/website-settings.mjs"
import block from "./sync/block-access.mjs"

export default async function s3sync(bucket) {
    console.group(`Deploying s3:${bucket.name}`)
    await setup(bucket)

    const {
        name,
        dir,
        prefix,
        policy = [],
        website = null,
        blockPublic = true
    } = bucket

    await syncFiles({name, dir, prefix})
    await block({name, blockPublic})
    await syncPolicy(name, policy)
    await syncWebsite(name, website)
    console.groupEnd()
}
