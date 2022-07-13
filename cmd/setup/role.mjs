import {
    waitUntilRoleExists,
} from "@aws-sdk/client-iam"

import { policyJSON, logging } from "../../internal/api.mjs"

const stsDefault = policyJSON({
    "Effect": "Allow",
    "Principal": {
        "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
})

const setupRole = async (svc, config, args) => {
    const { role } = args

    const awsArgs = {
        RoleName: role,
        AssumeRolePolicyDocument: stsDefault,
    }
    const roleInfo = await svc.iam.getRole(awsArgs)

    if (roleInfo === null) {
        console.log("Role not found, creating")
        const createdRole = svc.iam.createRole(awsArgs)
        await waitUntilRoleExists(
            {
                client: svc.iam.client,
                delay: 2,
                maxWaitTime: 60
            },
            awsArgs
        )

        return createdRole
    }

    return roleInfo
}

export default logging(
    args => `Check IAM Role: ${args.role}`,
    setupRole
)
