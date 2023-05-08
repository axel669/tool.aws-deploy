import { aws } from "#env"

const access = (acl, policy) => ({
    BlockPublicAcls: acl ?? true,
    IgnorePublicAcls: acl ?? true,
    BlockPublicPolicy: policy ?? true,
    RestrictPublicBuckets: policy ?? true,
})

const block = async (info) => {
    const { name, blockPublic } = info

    const settings =
        (typeof blockPublic === "boolean")
        ? access(blockPublic, blockPublic)
        : access(blockPublic.acl, blockPublic.policy)

    console.log("Setting public access blocks")
    await aws.s3.putPublicAccessBlock({
        Bucket: name,
        PublicAccessBlockConfiguration: settings,
    })
}

export default block
