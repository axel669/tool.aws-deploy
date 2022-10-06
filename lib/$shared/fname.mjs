const suffix = (action) => {
    const { alias, version } = action
    if (version !== undefined || alias !== undefined) {
        return `:${version ?? alias}`
    }
    return ""
}

const fname = (func, prefix, action) =>
    `${prefix}${func?.name ?? ""}${suffix(action)}`
fname.arn = (aws, name, action) => [
    "arn",
    "aws",
    "lambda",
    aws.region,
    aws.account,
    "function",
    `${name}${suffix(action)}`,
].join(":")

export default fname
