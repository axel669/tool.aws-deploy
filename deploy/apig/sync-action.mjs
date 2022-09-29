import { svc } from "#env"

const genActionArgs = (action) => {
    if (action.type === "http") {
        return {
            IntegrationType: "HTTP_PROXY",
            IntegrationMethod: action.method,
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
}

const syncAction = async (state, { apiID, name, info, id }) => {
    if (info === null) {
        // console.log(`Removing integration: ${name}`)
        await svc.apig.deleteIntegration({
            ApiId: apiID,
            IntegrationId: id,
        })
        delete state.actions[name]
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

export default syncAction
