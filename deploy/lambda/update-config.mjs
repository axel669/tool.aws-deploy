import { svc } from "#env"

export default async (current, funcConfig) => {
    const { runtime, timeout, memory, handler } = funcConfig

    const needsUpdate = (
        timeout !== current.Timeout
        || handler !== current.Handler
        || memory !== current.MemorySize
        || runtime !== current.Runtime
    )

    if (needsUpdate === false) {
        console.log("Config unchanged")
        return
    }

    console.log("Updating config...")
    await svc.lambda.updateFunctionConfiguration({
        FunctionName: current.FunctionName,
        Runtime: runtime,
        Timeout: timeout,
        MemorySize: memory,
        Handler: handler,
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
