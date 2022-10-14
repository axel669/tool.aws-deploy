import { aws, config } from "#env"
import fname from "#shared/fname"

const json = (item) => JSON.stringify(item)
const putAuth = async (api, auth, awsAuth) => {
    // const func = config.functions[auth.func]
    const apiarn = `arn:aws:apigateway:${config.region}:lambda:path/`
    const funcARN = fname.arn(aws, auth)

    const args = {
        ApiId: api.awsID,
        AuthorizerPayloadFormatVersion: "2.0",
        AuthorizerResultTtlInSeconds: auth.cache,
        AuthorizerType: "REQUEST",
        AuthorizerUri: `${apiarn}2015-03-31/functions/${funcARN}/invocations`,
        EnableSimpleResponses: true,
        IdentitySource: auth.idSource,
        Name: auth.key,
    }

    if (awsAuth === undefined) {
        console.log(`Creating authorizer: ${auth.key}`)
        const createdAuth = await aws.apig.createAuthorizer(args)
        auth.awsID = createdAuth.AuthorizerId
        return
    }

    auth.awsID = awsAuth.AuthorizerId
    const same = (
        auth.cache === awsAuth.AuthorizerResultTtlInSeconds
        && auth.key === awsAuth.Name
        && json(auth.idSource) === json(awsAuth.IdentitySource)
    )
    if (same === true) {
        return
    }

    console.log(`Creating authorizer: ${auth.key}`)
    await aws.apig.updateAuthorizer({
        AuthorizerId: awsAuth.AuthorizerId,
        ...args,
    })
}

const put = async (api, awsAuths) => {
    if (api.auth === undefined) {
        return
    }
    for (const auth of Object.values(api.auth)) {
        await putAuth(
            api,
            auth,
            awsAuths.find(
                awsAuth => awsAuth.Name === auth.key
            )
        )
    }
}

const cleanup = async (api, awsAuths) => {
    const unused = awsAuths.filter(
        (awsAuth) => api.auth?.[awsAuth.Name] === undefined
    )
    for (const awsAuth of unused) {
        console.log(`Removing authorizer: ${awsAuth.Name}`)
        await aws.apig.deleteAuthorizer({
            ApiId: api.awsID,
            AuthorizerId: awsAuth.AuthorizerId,
        })
    }
}

export default {
    put,
    cleanup,
}
