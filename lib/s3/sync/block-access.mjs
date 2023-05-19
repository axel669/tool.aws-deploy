import { aws } from "#env"

const access = ({acl = true, policy = true} = {}) => ({
    BlockPublicAcls: acl,
    IgnorePublicAcls: acl,
    BlockPublicPolicy: policy,
    RestrictPublicBuckets: policy,
})

const block = async (info) => {
    const { name, blockPublic } = info

    const settings = access(blockPublic)

    console.log("Setting public access blocks")
    await aws.s3.putPublicAccessBlock({
        Bucket: name,
        PublicAccessBlockConfiguration: settings,
    })
}

export default block
