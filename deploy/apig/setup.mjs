import { logging } from "../../internal/api.mjs"

const setupAPI = async (api) => {
    if (config.state.api[api.resID] !== undefined) {
        return
    }

    console.log("Creating API...")
    const apiInfo = await svc.apig.createApi({
        Name: api.name,
        ProtocolType: "HTTP",
    })
    config.state.api[api.resID] = {
        id: apiInfo.ApiId,
        actions: {},
        routes: {}
    }
}

export default logging(
    (api) => `Check API: ${api.name}`,
    setupAPI
)
