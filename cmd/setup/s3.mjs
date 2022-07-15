import { logging } from "../../internal/api.mjs"

const setupBucket = async (svc, config, args) => {
    const bucket = await svc.s3.getBucketAcl({
        Bucket: args.name,
    })

    if (bucket !== null) {
        return
    }

    console.log("Bucket does not exist, creating")
    await svc.s3.createBucket({
        Bucket: args.name,
    })
}

export default logging(
    (args) => `Check bucket: ${args.name}`,
    setupBucket
)
