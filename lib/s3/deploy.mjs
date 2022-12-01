import setup from "./deploy/setup.mjs"

import syncFiles from "./sync/files.mjs"
import syncPolicy from "./sync/policy.mjs"
import syncWebsite from "./sync/website-settings.mjs"

export default async function s3sync(bucket) {
    console.group(`Deploying s3:${bucket.name}`)
    await setup(bucket)

    const {
        name,
        dir,
        prefix,
        policy = [],
        website = null,
    } = bucket

    await syncFiles({name, dir, prefix})
    await syncPolicy(name, policy)
    await syncWebsite(name, website)
    console.groupEnd()
}
