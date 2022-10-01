import { svc, config } from "#env"

const errmsg = (str) => str.trim().replace(/\s+/, " ")
export default async (apiID, funcName, remove = false) => {
    const policy = await svc.lambda.getPolicy({
        FunctionName: funcName,
    })
    const id = `apig-${apiID}`

    if (remove === true) {
        console.log(`Removing permission from ${funcName}`)
        await svc.lambda.removePermission({
            FunctionName: funcName,
            StatementId: id,
        })
        return
    }

    if (policy !== null) {
        const items = JSON.parse(policy.Policy).Statement
        const existing = items.find(
            p => p.Sid === id
        )
        if (existing !== undefined) {
            return
        }
    }

    const arn = `arn:aws:execute-api:${config.region}:${svc.account}:${apiID}/*/*/`

    console.log(`Adding permissions to ${funcName}`)
    await svc.lambda.addPermission({
        Action: "lambda:invokeFunction",
        SourceArn: arn,
        FunctionName: funcName,
        Principal: "apigateway.amazonaws.com",
        StatementId: id,
    })
}
