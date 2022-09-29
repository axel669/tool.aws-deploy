const syncInt = async (svc, state, {apiID, name, info, id}) => {
    if (info === null) {
        return
    }

    if (id === undefined) {
        console.log(`Creating integration: ${name}`)
        const intInfo = await svc.apig.createIntegration({
            ApiId: apiID,
            IntegrationType: "HTTP_PROXY",
            IntegrationMethod: info.method,
            IntegrationUri: info.url,
            PayloadFormatVersion: "1.0"
        })
        state.actions[name] = intInfo.IntegrationId
        return
    }

    const current = await svc.apig.getIntegration({
        ApiId: apiID,
        IntegrationId: id
    })
    console.log(current)
}

const syncRoute = async (svc, state, {apiID, key, info, id, actionID}) => {
    if (info === null) {
        return
    }

    if (id === undefined) {
        console.log(`Creating route: ${key}`)
        const route = await svc.apig.createRoute({
            ApiId: apiID,
            RouteKey: key,
            Target: `integrations/${actionID}`
        })
        state.routes[key] = route.RouteId
        return
    }

    const current = await svc.apig.getRoute({
        ApiId: apiID,
        RouteId: id
    })
    console.log(current)
}

const deployAPI = async (svc, config, api) => {
    const state = config.state.api[api.resID]

    const apiID = state.id
    const ints = Object.entries(api.integrations)
    for (const [name, info] of ints) {
        await syncInt(svc, state, { apiID, name, info, id: state.actions[name] })
    }

    const routes = Object.entries(api.routes)
    for (const [key, info] of routes) {
        await syncRoute(
            svc,
            state,
            {
                apiID, key, info,
                id: state.routes[key],
                actionID: state.actions[info.action]
            }
        )
    }
}

export default deployAPI
