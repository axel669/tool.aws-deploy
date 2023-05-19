import { aws } from "#env"
import wait from "./wait.mjs"

import deepEQ from "deep-equal"

export default async (current, funcConfig) => {
    const {
        runtime,
        env = null,
        timeout = 5,
        memory = 128,
        handler = "index.handler",
    } = funcConfig

    const targetConfig = {
        Environment: (env === null) ? undefined : { Variables: env },
        Handler: handler,
        MemorySize: memory,
        Runtime: runtime,
        Timeout: timeout,
    }
    const currentConfig = {
        Environment: current.Environment,
        Handler: current.Handler,
        MemorySize: current.MemorySize,
        Runtime: current.Runtime,
        Timeout: current.Timeout,
    }

    const skipUpdate = deepEQ(targetConfig, currentConfig, { strict: true })

    if (skipUpdate === true) {
        console.log("Config unchanged")
        return
    }

    console.log("Updating config...")
    await aws.lambda.updateFunctionConfiguration({
        FunctionName: current.FunctionName,
        ...targetConfig,
    })
    await wait(current.FunctionName)
}
