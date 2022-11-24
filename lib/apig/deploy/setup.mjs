import { aws, config } from "#env"

const setupAPI = async (api) => {
    if (api.awsID !== undefined) {
        await aws.apig.updateApi({
            ApiId: api.awsID,
            Name: api.name,
        })
        return
    }

    console.log("Creating API...")
    const apiInfo = await aws.apig.createApi({
        Name: api.name,
        ProtocolType: "HTTP",
        Description: api.key,
        Tags: config.awsTags
    })
    api.awsID = apiInfo.ApiId
}

export default setupAPI
