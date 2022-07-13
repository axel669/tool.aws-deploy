const fwrap = (source, func, errorInfo) => {
    const {
        error,
        message,
        def = null
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
            // console.log(err.name)
            // console.log(error)
            // console.log(message)
            // console.log(err.message)
            if (isAllowedError === true) {
                return def
            }
            return err
        }
    }
}

const wrap = (Service, Client, modify, add) =>
    (initOptions) => {
        const source = new Service(initOptions)
        const client = new Client(initOptions)

        const internal = { client }
        const get = (_, func) => {
            if (internal[func] !== undefined) {
                return internal[func]
            }

            if (source[func] === undefined) {
                throw new Error(`${func} is not a function`)
            }

            return source[func]
        }
        const proxy = new Proxy( {}, { get } )

        for (const [func, info] of Object.entries(modify)) {
            internal[func] = fwrap(source, func, info)
        }
        // for (const [func, info] of Object.entries(add(proxy))) {
        //     internal[func] = info
        // }

        return proxy
    }

export { fwrap, wrap }
