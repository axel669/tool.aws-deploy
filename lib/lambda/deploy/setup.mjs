import { policyJSON, Code, logging } from "#internal"

import { aws, config, existing } from "#env"

import setupRole from "./role.mjs"
import setupInlinePolicy from "./inline-policy.mjs"
import wait from "./wait.mjs"

const lambdaLogging = (name, region, account) => policyJSON(
    {
        "Effect": "Allow",
        "Action": "logs:CreateLogGroup",
        "Resource": `arn:aws:logs:${region}:${account}:*`
    },
    {
        "Effect": "Allow",
        "Action": [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
        ],
        "Resource": [
            `arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${name}:*`
        ]
    }
)

const sleep = (time) => new Promise(
    resolve => setTimeout(resolve, time)
)

const createFunc = async (roleInfo, func, runtime) => {
    //  aws is stupid af, tons of extra wait time is needed to use
    //  the new role but no mechanism is provided to know when it will be
    //  usable, so we have to retry function creation until it works.
    //  30s should be enough time, but that's only based on what I have seen
    //  up to this point.
    const start = Date.now()
    let attempts = 0
    while ((Date.now() - start) < 30000) {
        attempts = attempts + 1

        console.log("Attempt", attempts)
        const createdFunc = await aws.lambda.createFunction({
            FunctionName: func,
            Role: roleInfo.Role.Arn,
            Runtime: runtime,
            Handler: "index.handler",
            Tags: config.awsTags,
            Code,
        })

        if (createdFunc instanceof Error) {
            throw createdFunc
        }

        if (createdFunc !== null) {
            await wait(func)
            // await aws.tags.tagResources({
            //     ResourceARNList: [createdFunc.FunctionArn],
            //     Tags: config.awsTags,
            // })
            return createdFunc
        }

        await sleep(2500)
    }
}

const setupLambda = async (lambda) => {
    const { lname, runtime } = lambda

    if (existing[`lambda:${lname}`] === true) {
        return
    }
    console.log("Function not found, creating")

    const role = `${lname}-role`

    const roleInfo = await setupRole({ role })
    await setupInlinePolicy({
        role,
        name: `${lname}-logging`,
        document: lambdaLogging(lname, config.region, aws.account)
    })

    await createFunc(roleInfo, lname, runtime)
}

export default setupLambda
