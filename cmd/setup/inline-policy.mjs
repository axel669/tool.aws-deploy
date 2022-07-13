import { logging } from "../../internal/api.mjs"

const setupInlinePolicy = async (svc, args) => {
    const { role, name, document } = args

    const awsArgs = {
        RoleName: role,
        PolicyName: name,
        PolicyDocument: document,
    }
    const policy = await svc.iam.getRolePolicy(awsArgs)

    if (policy === null) {
        console.log("Policy not found, creating")
        return svc.iam.putRolePolicy(awsArgs)
    }

    return policy
}

export default logging(
    args => `Check IAM Policy ${args.name} for ${args.role}`,
    setupInlinePolicy
)
