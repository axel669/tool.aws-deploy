import { state, svc } from "#env"

import syncAction from "./apig/sync-action.mjs"
import syncRoute from "./apig/sync-route.mjs"

const deployAPI = async (api) => {
    const apiState = state.api[api.resID]

    const apiID = apiState.id
    const ints = Object.entries(api.integrations)
    for (const [name, info] of ints) {
        await syncAction(
            apiState,
            { apiID, name, info, id: apiState.actions[name] }
        )
    }

    const routes = Object.entries(api.routes)
    for (const [key, info] of routes) {
        await syncRoute(
            apiState,
            {
                apiID, key, info,
                id: apiState.routes[key],
                actionID: apiState.actions[info.action]
            }
        )
    }

    const deployedRoutes = await svc.apig.getRoutes({ ApiId: apiID })
    const deadRoutes = deployedRoutes.Items.filter(
        (droute) => api.routes[droute.RouteKey] === undefined
    )
    for (const droute of deadRoutes) {
        await syncRoute(
            apiState,
            {
                apiID,
                key: droute.RouteKey,
                info: null,
                id: droute.RouteId,
            }
        )
    }

    const deployedActions = await svc.apig.getIntegrations({ ApiId: apiID })
    console.log(deployedActions)
    // const knownActions =
    //     Object.keys(api.integrations)
    //     .map(
    //         (name) => apiState.actions[name]
    //     )
    // const deadActions = deployedActions.Items.filter(
    //     (daction) => knownActions.includes(daction.IntegrationId) === false
    // )
    // console.log("Removing unused integrations")
    // for (const daction of deadActions) {
    //     await syncAction(
    //         apiState,
    //         {
    //             apiID,
    //             info: null,
    //             id: daction.IntegrationId,
    //         }
    //     )
    // }
}

export default deployAPI
