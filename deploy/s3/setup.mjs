import { svc } from "#env"
import { logging } from "#internal"

const setupBucket = async (bucketInfo) => {
    const bucket = await svc.s3.getBucketAcl({
        Bucket: bucketInfo.name,
    })

    if (bucket !== null) {
        return
    }

    console.log("Bucket does not exist, creating")
    await svc.s3.createBucket({
        Bucket: bucketInfo.name,
    })
}

export default logging(
    (bucket) => `Check bucket: ${bucket.name}`,
    setupBucket
)
