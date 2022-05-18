import path from "path"

import {
    Lambda,
    LambdaClient,
    waitUntilFunctionUpdated
} from "@aws-sdk/client-lambda"
import admzip from "adm-zip"

export default async function deployLambda(config, info, full) {
    const {
        region,
        prodTag,
        alias,
        skipVersioning = false,
        profile = "default",
    } = config
    const {
        dir,
    } = info
    const lambda = new Lambda({
        region,
        profile,
    })
    const waiterClient = new LambdaClient({
        region,
        profile,
    })

    const FunctionName = path.basename(dir)
    const zip = new admzip()
    zip.addLocalFolder(dir)
    const ZipFile = zip.toBuffer()

    console.group(FunctionName)

    console.log("uploading code")
    const status = await lambda.updateFunctionCode({
        FunctionName,
        ZipFile,
    })
    const { CodeSha256 } = status

    if (skipVersioning === true || full !== true) {
        return
    }

    await waitUntilFunctionUpdated(
        {
            client: waiterClient,
            delay: 2,
            maxWaitTime: 60
        },
        { FunctionName }
    )
    console.log("versioning")
    const versionInfo = await lambda.publishVersion({
        FunctionName,
        CodeSha256,
    })

    console.log("updating aliases")
    await lambda.createAlias({
        FunctionName,
        FunctionVersion: versionInfo.Version,
        Name: alias.replace(/\./g, "-")
    })
    await lambda.updateAlias({
        FunctionName,
        FunctionVersion: versionInfo.Version,
        Name: prodTag,
    })
    console.groupEnd()
}
