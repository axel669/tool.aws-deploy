import { aws, config } from "#env"
import deepEQ from "deep-equal"

const upper = (value) => value.toUpperCase()
const lower = (value) => value.toLowerCase()
const setupAPI = async (api) => {
    const cors = (api.cors === undefined)
        ? undefined
        : {
            AllowCredentials: api.cors.credentials ?? false,
            AllowHeaders: api.cors.headers?.map(lower),
            AllowMethods: api.cors.methods?.map(upper),
            AllowOrigins: api.cors.origins,
            ExposeHeaders: api.cors.expose?.map(lower),
            MaxAge: api.cors.maxAge ?? 0
        }
    if (api.awsID !== undefined) {
        const current = await aws.apig.getApi({ ApiId: api.awsID })
        const targetConfig = {
            Name: api.name,
            CorsConfiguration: cors,
        }
        const currentConfig = {
            Name: current.Name,
            CorsConfiguration: current.CorsConfiguration,
        }
        const skipUpdate = deepEQ(targetConfig, currentConfig, { strict: true })
        if (skipUpdate === true) {
            console.log("Config unchanged")
            return
        }

        console.log("Updating Config")
        await aws.apig.updateApi({
            ApiId: api.awsID,
            ...targetConfig,
        })
        return
    }

    console.log("Creating API...")
    const apiInfo = await aws.apig.createApi({
        Name: api.name,
        ProtocolType: "HTTP",
        Description: api.key,
        Tags: config.awsTags,
        CorsConfiguration: cors
    })
    api.awsID = apiInfo.ApiId
}

export default setupAPI
