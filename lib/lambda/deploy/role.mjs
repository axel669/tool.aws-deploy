import { aws } from "#env"
import { policyJSON, logging } from "#internal"

import {
    waitUntilRoleExists,
} from "@aws-sdk/client-iam"

const stsDefault = policyJSON({
    "Effect": "Allow",
    "Principal": {
        "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
})

const setupRole = async (args) => {
    const { role } = args

    const awsArgs = {
        RoleName: role,
        AssumeRolePolicyDocument: stsDefault,
    }
    const roleInfo = await aws.iam.getRole(awsArgs)

    if (roleInfo === null) {
        console.log("Role not found, creating")
        const createdRole = aws.iam.createRole(awsArgs)
        await waitUntilRoleExists(
            {
                client: aws.iam.client,
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
