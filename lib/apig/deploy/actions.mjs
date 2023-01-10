import { aws, config } from "#env"
import fname from "#shared/fname"

const genActionArgs = (action) => {
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

    return {
        ...baselineArgs,
        IntegrationUri: fname.arn(aws, action)
    }
}

const putAction = async (api, action, awsAction) => {
    const actionArgs = genActionArgs(action)
    if (awsAction === undefined) {
        console.log(`Creating integration: ${action.key}`)
        const createdAction = await aws.apig.createIntegration({
            ApiId: api.awsID,
            Description: action.key,
            ...actionArgs,
        })
        action.awsID = createdAction.IntegrationId
        return
    }

    action.awsID = awsAction.IntegrationId
    const shouldUpdate = (
        awsAction.IntegrationType !== actionArgs.IntegrationType
        || awsAction.IntegrationMethod !== actionArgs.IntegrationMethod
        || awsAction.IntegrationUri !== actionArgs.IntegrationUri
        || awsAction.PayloadFormatVersion !== actionArgs.PayloadFormatVersion
    )
    if (shouldUpdate === false) {
        return
    }

    console.log(`Updating integration: ${action.key}`)
    await aws.apig.updateIntegration({
        ApiId: api.awsID,
        IntegrationId: awsAction.IntegrationId,
        ...actionArgs,
    })
}
const put = async (api, awsActions) => {
    for (const action of Object.values(api.actions)) {
        await putAction(
            api,
            action,
            awsActions.find(
                awsAction => awsAction.Description === action.key
            )
        )
    }
}

const cleanup = async (api, awsActions) => {
    const unused = awsActions.filter(
        (awsAction) => api.actions[awsAction.Description] === undefined
    )
    for (const awsAction of unused) {
        console.log(`Removing integration: ${awsAction.Description}`)
        await aws.apig.deleteIntegration({
            ApiId: api.awsID,
            IntegrationId: awsAction.IntegrationId,
        })
    }
}

export default {
    put,
    cleanup,
}
