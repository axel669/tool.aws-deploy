import { aws, config } from "#env"
import fname from "#shared/fname"

import deepEQ from "deep-equal"

const genActionArgs = (action) => {
    if (action.type === "http") {
        return {
            IntegrationType: "HTTP_PROXY",
            IntegrationMethod: action.method.toUpperCase(),
            IntegrationUri: action.url,
            PayloadFormatVersion: "1.0",
            RequestParameters: action.requestParams,
        }
    }

    const baselineArgs = {
        IntegrationType: "AWS_PROXY",
        IntegrationMethod: "POST",
        PayloadFormatVersion: "2.0",
        RequestParameters: action.requestParams,
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
    const awsActionArgs = {
        IntegrationType: awsAction.IntegrationType,
        IntegrationMethod: awsAction.IntegrationMethod,
        IntegrationUri: awsAction.IntegrationUri,
        PayloadFormatVersion: awsAction.PayloadFormatVersion,
        RequestParameters: awsAction.RequestParameters,
    }
    const skipUpdate = deepEQ(awsActionArgs, actionArgs, { strict: true })
    if (skipUpdate === true) {
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
