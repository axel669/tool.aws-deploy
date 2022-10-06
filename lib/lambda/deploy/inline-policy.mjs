import { aws } from "#env"
import { logging } from "#internal"

const setupInlinePolicy = async (args) => {
    const { role, name, document } = args

    const awsArgs = {
        RoleName: role,
        PolicyName: name,
        PolicyDocument: document,
    }
    const policy = await aws.iam.getRolePolicy(awsArgs)

    if (policy === null) {
        console.log("Policy not found, creating")
        return aws.iam.putRolePolicy(awsArgs)
    }

    return policy
}

export default logging(
    args => `Check IAM Policy ${args.name} for ${args.role}`,
    setupInlinePolicy
)
