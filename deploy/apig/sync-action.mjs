import { svc, config } from "#env"

const genActionArgs = async (action) => {
    if (action.type === "http") {
        return {
            IntegrationType: "HTTP_PROXY",
            IntegrationMethod: action.method.toUpperCase(),
            IntegrationUri: action.url,
            PayloadFormatVersion: "1.0"
        }
    }

    const baselineArgs = {
        IntegrationType: "AWS_PROXY",
        IntegrationMethod: "POST",
        PayloadFormatVersion: "2.0"
    }
    if (action.arn !== undefined) {
        return {
            ...baselineArgs,
            IntegrationUri: action.arn
        }
    }

    const funcName = `${config.prefix}${config.functions[action.func].name}`
    const func = await svc.lambda.getFunction({
        FunctionName: funcName
    })

    const suffix = (
            action.version !== undefined
            || action.alias !== undefined
        )
        ? `:${action.version ?? action.alias}`
        : ""
    const arn = `${func.Configuration.FunctionArn}${suffix}`

    return {
        ...baselineArgs,
        IntegrationUri: arn,
    }
}

const syncAction = async (state, { apiID, name, info, id }) => {
    if (info === null) {
        await svc.apig.deleteIntegration({
            ApiId: apiID,
            IntegrationId: id,
        })
        const key = (
            Object.entries(state.actions)
            .find(
                action => action[1] === id
            )
            ?? []
        )[0]
        delete state.actions[key]
        return
    }

    const actionArgs = await genActionArgs(info)
    if (id === undefined) {
        console.log(`Creating integration: ${name}`)
        const intInfo = await svc.apig.createIntegration({
            ApiId: apiID,
            ...actionArgs
        })
        state.actions[name] = intInfo.IntegrationId
        return
    }

    const current = await svc.apig.getIntegration({
        ApiId: apiID,
        IntegrationId: id
    })

    const shouldUpdate = (
        current.IntegrationType !== actionArgs.IntegrationType
        || current.IntegrationMethod !== actionArgs.IntegrationMethod
        || current.IntegrationUri !== actionArgs.IntegrationUri
        || current.PayloadFormatVersion !== actionArgs.PayloadFormatVersion
    )
    if (shouldUpdate === false) {
        return
    }

    console.log(`Updating integration: ${name}`)
    await svc.apig.updateIntegration({
        ApiId: apiID,
        IntegrationId: id,
        ...actionArgs,
    })
}

export default syncAction
