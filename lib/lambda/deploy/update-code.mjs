import { aws } from "#env"

import wait from "./wait.mjs"

export default async (current, code, ZipFile) => {
    if (code === current.CodeSha256) {
        console.log("Code unchanged")
        return
    }

    console.log("Updating code...")
    await aws.lambda.updateFunctionCode({
        ZipFile,
        FunctionName: current.FunctionName,
    })

    await wait(current.FunctionName)
    // await waitUntilFunctionUpdated(
    //     {
    //         client: aws.lambda.client,
    //         delay: 2,
    //         maxWaitTime: 60
    //     },
    //     { FunctionName: current.FunctionName }
    // )
}
