import { aws, config } from "#env"
import fname from "#shared/fname"

const putPerms = async (api, source, type) => {
    const id = `apig-${api.awsID}-${source.awsID}-${type}`
    const func = fname(config.functions[source.func], config.prefix, source)

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

    const arnPrefix =
        `arn:aws:execute-api:${config.region}:${aws.account}:${api.awsID}`
    const arn =
        (type === "integrations")
            ? `${arnPrefix}/*/*/`
            : `${arnPrefix}/authorizers/${source.awsID}`

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
    const functions = Object.values(api[type]).filter(
        (item) => item.type === "function"
    )
    for (const item of functions) {
        await putPerms(api, item, type)
    }
}

const cleanup = async ({api, items, type, idProp}) => {
    const functions = items.filter(
        (item) => (
            item.type === "function"
            && api[type][item[idProp]] === undefined
        )
    )
    for (const item of functions) {
        const id = `apig-${api.awsID}-${item.awsID}-${type}`
        const func = fname(config.functions[item.func], config.prefix, item)
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
