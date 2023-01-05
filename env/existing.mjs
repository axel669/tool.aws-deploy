import config from "./config.mjs"
import aws from "./aws.mjs"

const serviceTransform = {
    s3: (parts) => {
        return [`s3:${parts[5]}`, true]
    },
    lambda: (parts) => {
        return [`lambda:${parts[6]}`, true]
    },
    apigateway: async (parts) => {
        const [, , id] = parts[5].split("/")
        const awsAPI = await aws.apig.getApi({ ApiId: id })
        const source = config.apig?.[awsAPI.Description] ?? {}
        source.awsID = id
        return [`apig:${id}`, true]
    },
}
const translateARN = async (dest, {ResourceARN}) => {
    const arnParts = ResourceARN.split(":")
    const [, , service] = arnParts

    console.log(`Found existing resource: ${ResourceARN}`)
    const [key, value] = await serviceTransform[service](arnParts)
    dest[key] = value
}
const areduce = async (source, acc) => {
    const dest = {}

    for (const item of source) {
        await acc(dest, item)
    }

    return dest
}

console.log("Scanning AWS for deployed resources...")
const resources = await aws.tags.getResources({
    TagFilters: Object.entries(config.awsTags).map(
        ([Key, value]) => ({ Key, Values: [value] })
    )
})

const existing = await areduce(
    resources.ResourceTagMappingList,
    translateARN
)

export default existing
