import { state, svc, config } from "#env"
import { logging } from "#internal"

import setup from "./apig/setup.mjs"

import deployStage from "./apig/deploy-stage.mjs"
import syncAction from "./apig/sync-action.mjs"
import syncRoute from "./apig/sync-route.mjs"
import syncPerm from "./apig/sync-perm.mjs"

const suffix = (action) => {
    const { alias, version } = action
    if (version !== undefined || alias !== undefined) {
        return `:${version ?? alias}`
    }
    return ""
}
const fname = (func, prefix, action) =>
    `${prefix}${func.name}${suffix(action)}`

const deployAPI = async (api) => {
    await setup(api)
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
    const knownActions =
        Object.keys(api.integrations)
        .map(
            (name) => apiState.actions[name]
        )
    const deadActions = deployedActions.Items.filter(
        (daction) => knownActions.includes(daction.IntegrationId) === false
    )
    console.log("Removing unused integrations")
    for (const daction of deadActions) {
        await syncAction(
            apiState,
            {
                apiID,
                info: null,
                id: daction.IntegrationId,
            }
        )
    }

    const activeFuncs =
        Object.values(api.integrations)
        .filter(
            (action) => action.type === "function" && action.arn === undefined
        )
        .map(
            (action) => fname(
                config.functions[action.func],
                config.prefix,
                action
            )
            // (action) => `${config.prefix}${config.functions[action.func].name}`
        )
    const managedFuncs = apiState.policy
    const removedFuncs = managedFuncs.filter(
        (name) => activeFuncs.includes(name) === false
    )

    for (const funcName of activeFuncs) {
        await syncPerm(apiID, funcName)
    }
    apiState.policy = activeFuncs
    for (const funcName of removedFuncs) {
        await syncPerm(apiID, funcName, true)
    }

    await deployStage(api, apiID)
}

export default logging(
    (api) => `Deploying API '${api.name}'`,
    deployAPI
)
