import crypto from "crypto"

import admzip from "adm-zip"

import { config, aws } from "#env"

import { policyJSON, logging } from "#internal"

import setup from "./deploy/setup.mjs"
import updateAlias from "./deploy/update-alias.mjs"
import updateCode from "./deploy/update-code.mjs"
import updateConfig from "./deploy/update-config.mjs"
import updatePolicy from "./deploy/update-policy.mjs"

const deployLambda = async (lambda) => {
    await setup(lambda)

    const {
        name,
        dir,
        iam = [],
        ...funcConfig
        // runtime,
        // timeout = 5,
        // memory = 128,
        // handler = "index.handler",
    } = lambda

    const zip = new admzip()
    zip.addLocalFolder(dir)
    const ZipFile = zip.toBuffer()

    const codeSHA = crypto.createHash("sha256")
        .update(ZipFile)
        .digest("base64")

    const current = await aws.lambda.getFunction({
        FunctionName: name
    })

    await updateConfig(current.Configuration, funcConfig)
    await updateCode(current.Configuration, codeSHA, ZipFile)
    await updatePolicy(
        name,
        policyJSON(...iam)
    )

    await updateAlias(name, codeSHA)
}

export default logging(
    (func) => `Deploying Lambda: (${func.key}) ${func.name}`,
    deployLambda
)
