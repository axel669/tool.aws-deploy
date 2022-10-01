import { state, svc } from "#env"
import { logging } from "#internal"

const setupAPI = async (api) => {
    if (state.api[api.resID] !== undefined) {
        return
    }

    console.log("Creating API...")
    const apiInfo = await svc.apig.createApi({
        Name: api.name,
        ProtocolType: "HTTP",
    })
    state.api[api.resID] = {
        id: apiInfo.ApiId,
        actions: {},
        routes: {},
        policy: [],
    }
}

export default logging(
    (api) => `Check API: ${api.name}`,
    setupAPI
)
