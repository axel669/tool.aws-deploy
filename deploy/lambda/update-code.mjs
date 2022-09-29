import {
    waitUntilFunctionUpdated
} from "@aws-sdk/client-lambda"

import { svc } from "#env"

export default async (current, code, ZipFile) => {
    if (code === current.CodeSha256) {
        console.log("Code unchanged")
        return
    }

    console.log("Updating code...")
    await svc.lambda.updateFunctionCode({
        ZipFile,
        FunctionName: current.FunctionName,
    })

    await waitUntilFunctionUpdated(
        {
            client: svc.lambda.client,
            delay: 2,
            maxWaitTime: 60
        },
        { FunctionName: current.FunctionName }
    )
}
