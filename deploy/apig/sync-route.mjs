import { svc } from "#env"

const syncRoute = async (state, { apiID, key, info, id, actionID }) => {
    if (info === null) {
        console.log(`Removing route: ${key}`)
        await svc.apig.deleteRoute({
            ApiId: apiID,
            RouteId: id,
        })
        delete state.routes[key]
        return
    }

    const Target = `integrations/${actionID}`

    if (id === undefined) {
        console.log(`Creating route: ${key}`)
        const route = await svc.apig.createRoute({
            Target,
            ApiId: apiID,
            RouteKey: key,
        })
        state.routes[key] = route.RouteId
        return
    }

    const current = await svc.apig.getRoute({
        ApiId: apiID,
        RouteId: id
    })

    if (current.Target === Target) {
        return
    }

    console.log(`Updating route: ${key}`)
    await svc.apig.updateRoute({
        Target,
        ApiId: apiID,
        RouteId: id,
        RouteKey: key,
    })
}

export default syncRoute
