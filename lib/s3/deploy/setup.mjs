import { aws, config, existing } from "#env"

const setupBucket = async (bucket) => {
    if (existing[`s3:${bucket.name}`] === true) {
        return
    }

    console.log(`Creating bucket`)
    const arn = `arn:aws:s3:::${bucket.name}`
    await aws.s3.createBucket({
        Bucket: bucket.name,
    })

    await aws.tags.tagResources({
        ResourceARNList: [arn],
        Tags: config.awsTags
    })
}

export default setupBucket
