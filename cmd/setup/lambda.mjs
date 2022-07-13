import { policyJSON, Code, logging } from "../../internal/api.mjs"

import setupRole from "./role.mjs"
import setupInlinePolicy from "./inline-policy.mjs"

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

const setupLambda = async (svc, args) => {
    const { func, runtime } = args

    const funcInfo = await svc.lambda.getFunction({
        FunctionName: func
    })

    if (funcInfo === null) {
        console.log("Function not found, creating")

        const role = `${func}-role`

        const roleInfo = await setupRole(svc, { role })
        await setupInlinePolicy(
            svc,
            {
                role,
                name: `${func}-logging`,
                document: lambdaLogging(func, svc.region, svc.account)
            }
        )

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
            const createdFunc = await svc.lambda.createFunction({
                FunctionName: func,
                Role: roleInfo.Role.Arn,
                Runtime: runtime,
                Handler: "index.handler",
                Code,
            })

            if (createdFunc instanceof Error) {
                throw createdFunc
            }

            if (createdFunc !== null) {
                return createdFunc
            }

            await sleep(2500)
        }
    }

    return funcInfo
}

export default logging(
    args => `Check Lambda: ${args.func}`,
    setupLambda
)
