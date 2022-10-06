import { aws } from "#env"

export default async (func, policy) => {
    const RoleName = `${func}-role`
    const PolicyName = `${func}-inline-policy`
    const currentPolicy = await aws.iam.getRolePolicy({
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
        await aws.iam.deleteRolePolicy({
            RoleName,
            PolicyName,
        })
        return
    }

    console.log("Updating IAM policy...")
    await aws.iam.putRolePolicy({
        RoleName,
        PolicyName,
        PolicyDocument: policy
    })
}
