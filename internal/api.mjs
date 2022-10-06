import policyJSON from "./policy.mjs"
import Code from "./lambda-code.mjs"

const logging = (open, func) =>
    async (args) => {
        console.group(
            open(args)
        )
        const value = await func(args)
        console.groupEnd()
        return value
    }

export {
    logging,
    policyJSON,
    Code,
}
