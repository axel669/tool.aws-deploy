import { svc } from "#env"

export default async (func, policy) => {
    const RoleName = `${func}-role`
    const PolicyName = `${func}-inline-policy`
    const currentPolicy = await svc.iam.getRolePolicy({
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
        await svc.iam.deleteRolePolicy({
            RoleName,
            PolicyName,
        })
        return
    }

    console.log("Updating IAM policy...")
    await svc.iam.putRolePolicy({
        RoleName,
        PolicyName,
        PolicyDocument: policy
    })
}
