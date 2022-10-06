import { aws } from "#env"

const emptyBucket = async (bucket) => {
    const { Contents = [] } = await aws.s3.listObjectsV2({
        Bucket: bucket.name
    })

    if (Contents.length === 0) {
        return
    }

    await aws.s3.deleteObjects({
        Bucket: bucket.name,
        Delete: {
            Objects: Contents,
        },
    })
}

export default async (bucket) => {
    console.log("Removing objects")
    await emptyBucket(bucket)

    console.log("Deleting")
    await aws.s3.deleteBucket({ Bucket: bucket.name })
}
