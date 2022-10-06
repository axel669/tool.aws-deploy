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
        lname,
        runtime,
        dir,
        timeout = 5,
        memory = 128,
        iam = [],
        handler = "index.handler",
    } = lambda

    const zip = new admzip()
    zip.addLocalFolder(dir)
    const ZipFile = zip.toBuffer()

    const codeSHA = crypto.createHash("sha256")
        .update(ZipFile)
        .digest("base64")

    const current = await aws.lambda.getFunction({
        FunctionName: lname
    })

    await updateConfig(
        aws,
        current.Configuration,
        { memory, handler, runtime, timeout }
    )
    await updateCode(current.Configuration, codeSHA, ZipFile)
    await updatePolicy(
        lname,
        policyJSON(...iam)
    )

    await updateAlias(lname, codeSHA)
}

export default logging(
    (func) => `Deploying Lambda: (${func.key}) ${func.lname}`,
    deployLambda
)
