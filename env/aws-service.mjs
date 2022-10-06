const wrapAWSCall = (source, func, errorInfo) => {
    const {
        error,
        message,
        default:def = null
    } = errorInfo
    return async (args) => {
        try {
            return await source[func](args)
        }
        catch (err) {
            const isAllowedError = (
                err.name === error
                && (
                    message === undefined
                    || err.message === message
                )
            )
            if (isAllowedError === true) {
                return def
            }
            return err
        }
    }
}

const awsService = (options) =>
    async ({libName, name, modify}) => {
        const lib = await import(libName)

        const source = new lib[name](options)
        const client = new lib[`${name}Client`](options)

        const internal = { client }
        const get = (_, func) => {
            if (func === "then") {
                return undefined
            }
            if (internal[func] !== undefined) {
                return internal[func]
            }

            if (source[func] === undefined) {
                throw new Error(`${func} is not a function`)
            }

            return source[func]
        }
        const proxy = new Proxy({}, { get })

        for (const [func, info] of Object.entries(modify)) {
            internal[func] = wrapAWSCall(source, func, info)
        }

        return proxy
    }

export default awsService
