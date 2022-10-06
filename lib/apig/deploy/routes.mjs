import { aws, config } from "#env"
import fname from "#shared/fname"

const putRoute = async (api, route, awsRoute) => {
    const Target = `integrations/${api.integrations[route.action].awsID}`
    const authInfo =
        (route.auth === undefined)
        ? {
            AuthorizationType: "NONE",
        }
        : {
            AuthorizationType: "CUSTOM",
            AuthorizerId: api.auth[route.auth].awsID,
        }

    if (awsRoute === undefined) {
        console.log(`Creating route: ${route.key}`)
        await aws.apig.createRoute({
            Target,
            ApiId: api.awsID,
            RouteKey: route.key,
            ...authInfo,
        })
        return
    }

    const same = (
        awsRoute.RouteKey === route.key
        && awsRoute.Target === Target
        && awsRoute.AuthorizerId === authInfo.AuthorizerId
    )
    if (same === true) {
        return
    }

    console.log(`Updating route: ${route.key}`)
    await aws.apig.updateRoute({
        Target,
        ApiId: api.awsID,
        RouteId: awsRoute.RouteId,
        RouteKey: route.key,
        ...authInfo,
    })
}

const put = async (api, awsRoutes) => {
    for (const route of Object.values(api.routes)) {
        await putRoute(
            api,
            route,
            awsRoutes.find(
                awsRoute => awsRoute.RouteKey === route.key
            )
        )
    }
}

const cleanup = async (api, awsRoutes) => {
    const unused = awsRoutes.filter(
        (awsRoute) => api.routes[awsRoute.RouteKey] === undefined
    )
    for (const awsRoute of unused) {
        console.log(`Removing route: ${awsRoute.RouteKey}`)
        await aws.apig.deleteRoute({
            ApiId: api.awsID,
            RouteId: awsRoute.RouteId,
        })
    }
}

export default {
    put,
    cleanup,
}
