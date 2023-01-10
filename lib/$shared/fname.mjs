const suffix = (action) => {
    const { alias, version } = action
    if (version !== undefined || alias !== undefined) {
        return `:${version ?? alias}`
    }
    return ""
}

const fname = (func, prefix, action) =>
    `${prefix}${func?.name ?? ""}${suffix(action)}`
fname.arn = (aws, action) => [
    "arn",
    "aws",
    "lambda",
    aws.region,
    aws.account,
    "function",
    action.lname,
].join(":")

export default fname
