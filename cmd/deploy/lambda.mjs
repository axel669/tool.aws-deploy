import crypto from "crypto"

import {
    waitUntilFunctionUpdated
} from "@aws-sdk/client-lambda"
import admzip from "adm-zip"
import { policyJSON } from "../../internal/api.mjs"

const updateConfig = async (svc, current, config) => {
    const { func, runtime, timeout, memory, handler } = config

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
        FunctionName: func,
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
        { FunctionName: func }
    )
}
const updateCode = async (svc, current, code, ZipFile) => {
    if (code === current.CodeSha256) {
        console.log("Code unchanged")
        return
    }

    console.log("Updating code...")
    await svc.lambda.updateFunctionCode({
        ZipFile,
        FunctionName: func,
    })

    await waitUntilFunctionUpdated(
        {
            client: svc.lambda.client,
            delay: 2,
            maxWaitTime: 60
        },
        { FunctionName: func }
    )
}
const updatePolicy = async (svc, func, policy) => {
    const RoleName = `${func}-role`
    const PolicyName = `${func}-inline-policy`
    const currentPolicy = await svc.iam.getRolePolicy({
        RoleName,
        PolicyName,
    })

    const current = (currentPolicy === null)
        ? null
        : decodeURIComponent(currentPolicy.PolicyDocument)
    if (current === policy) {
        console.log("Policy unchanged")
        return
    }

    if (policy === null) {
        console.log("Removing IAM policy...")
        await svc.iam.deleteRolePolicy({
            RoleName,
            PolicyName,
        })
        return
    }

    console.log("Updating IAM policy...")
    await svc.iam.putRolePolicy({
        RoleName,
        PolicyName,
        PolicyDocument: policy
    })
}

const deployLambda = async (svc, config, args) => {
    const {
        name,
        runtime,
        dir,
        timeout = 5,
        memory = 128,
        iam = [],
        handler = "index.handler",
    } = args
    const func = `${config.prefix}${name}`

    console.group(`Deploying ${func}`)

    const zip = new admzip()
    zip.addLocalFolder(dir)
    const ZipFile = zip.toBuffer()

    const codeSHA = crypto.createHash("sha256")
        .update(ZipFile)
        .digest("base64")

    const current = await svc.lambda.getFunction({
        FunctionName: func
    })

    if (current === null) {
        console.log(`Function ${func} does not exist. Please run setup before deploying`)
    }

    await updateConfig(
        svc,
        current.Configuration,
        { func, memory, handler, runtime, timeout }
    )
    await updateCode(svc, current.Configuration, codeSHA, ZipFile)
    await updatePolicy(
        svc,
        func,
        policyJSON(...iam)
    )

    console.groupEnd()
}

export default deployLambda
