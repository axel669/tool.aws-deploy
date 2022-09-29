import crypto from "crypto"

import admzip from "adm-zip"

import { config, svc } from "#env"

import { policyJSON } from "#internal"

import setup from "./lambda/setup.mjs"
import updateAlias from "./lambda/update-alias.mjs"
import updateCode from "./lambda/update-code.mjs"
import updateConfig from "./lambda/update-config.mjs"
import updatePolicy from "./lambda/update-policy.mjs"

const deployLambda = async (lambda) => {
    await setup(lambda)

    const {
        name,
        runtime,
        dir,
        timeout = 5,
        memory = 128,
        iam = [],
        handler = "index.handler",
    } = lambda
    const func = `${config.prefix}${name}`

    console.group(`Deploying lambda:${func}`)

    const zip = new admzip()
    zip.addLocalFolder(dir)
    const ZipFile = zip.toBuffer()

    const codeSHA = crypto.createHash("sha256")
        .update(ZipFile)
        .digest("base64")

    const current = await svc.lambda.getFunction({
        FunctionName: func
    })

    await updateConfig(
        svc,
        current.Configuration,
        { memory, handler, runtime, timeout }
    )
    await updateCode(current.Configuration, codeSHA, ZipFile)
    await updatePolicy(
        func,
        policyJSON(...iam)
    )

    await updateAlias(func, codeSHA)

    console.groupEnd()
}

export default deployLambda
