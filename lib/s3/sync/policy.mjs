import { aws } from "#env"
import { policyJSON } from "#internal"

const syncPolicy = async (name, policy) => {
    const info = await aws.s3.getBucketPolicy({ Bucket: name })
    const json = policyJSON(...policy)

    if (info.Policy === json) {
        console.log("Policy unchanged")
        return
    }

    if (json === null) {
        console.log("Removing policy")
        await aws.s3.deleteBucketPolicy({ Bucket: name })
        return
    }

    console.log("Updating bucket policy")
    await aws.s3.putBucketPolicy({
        Bucket: name,
        Policy: json
    })
}

export default syncPolicy
