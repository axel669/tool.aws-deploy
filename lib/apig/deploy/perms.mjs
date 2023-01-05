import { aws, config } from "#env"
// import fname from "#shared/fname"

const putPerms = async (api, source, type) => {
    const id = `apig-${api.awsID}-${source.awsID}-${type}`
    // const func = fname(config.functions[source.func], config.prefix, source)
    const func = source.lname

    const awsPolicy = await aws.lambda.getPolicy({
        FunctionName: func,
    })

    if (awsPolicy !== null) {
        const items = JSON.parse(awsPolicy.Policy).Statement
        const existing = items.find(
            p => p.Sid === id
        )
        if (existing !== undefined) {
            return
        }
    }

    const arn =
        `arn:aws:execute-api:${config.region}:${aws.account}:${api.awsID}/*/*`
    // const arn =
    //     (type === "integrations")
    //         ? `${arnPrefix}/*/*`
    //         : `${arnPrefix}/authorizers/${source.awsID}`

    console.log(`Adding permissions to ${func}`)
    await aws.lambda.addPermission({
        Action: "lambda:invokeFunction",
        SourceArn: arn,
        FunctionName: func,
        Principal: "apigateway.amazonaws.com",
        StatementId: id,
    })
}
const put = async (api, type) => {
    const functions = Object.values(api[type] ?? {}).filter(
        (item) => item.type === "function"
    )
    for (const item of functions) {
        await putPerms(api, item, type)
    }
}

const cleanup = async ({api, items, type, idProp}) => {
    // console.log(items)
    const functions = items.filter(
        (item) => (
            (
                idProp === "Name"
                || item.IntegrationType === "AWS_PROXY"
            )
            && api[type][item[idProp]] === undefined
        )
    )
    for (const item of functions) {
        const itemID = item.IntegrationId ?? item.AuthorizerId
        const id = `apig-${api.awsID}-${itemID}-${type}`
        const func = item.IntegrationUri ?? item.AuthorizerUri.substring(
            item.AuthorizerUri.indexOf("functions/") + 10,
            item.AuthorizerUri.indexOf("/invocations")
        )
        console.log(`Removing permission from ${func}`)
        await aws.lambda.removePermission({
            FunctionName: func,
            StatementId: id,
        })
    }
}

export default {
    put,
    cleanup,
}
