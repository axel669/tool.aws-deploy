import { aws, config } from "#env"

export default async (func, codeSHA) => {
    const skipUpdate = (
        config.deployment.alias === undefined
        || config.deployment.tag === undefined
    )
    if (skipUpdate === true) {
        console.log("Skipping alias update")
        return
    }

    console.log("Updating aliases")
    const versionInfo = await aws.lambda.publishVersion({
        FunctionName: func,
        CodeSha256: codeSHA,
    })

    await aws.lambda.createAlias({
        FunctionName: func,
        FunctionVersion: versionInfo.Version,
        Name: config.deployment.tag.replace(/\./g, "-")
    })
    const alias = await aws.lambda.getAlias({
        FunctionName: func,
        Name: config.deployment.alias
    })

    const aliasInfo = {
        FunctionName: func,
        FunctionVersion: versionInfo.Version,
        Name: config.deployment.alias.replace(/\./g, "-")
    }
    if (alias === null) {
        console.log(`Creating alias: ${aliasInfo.Name}`)
        await aws.lambda.createAlias(aliasInfo)
        return
    }

    await aws.lambda.updateAlias(aliasInfo)
}
