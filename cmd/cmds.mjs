import setupLambda from "./setup/lambda.mjs"

import deployLambda from "./deploy/lambda.mjs"

export default {
    setup: {
        lambda: setupLambda,
    },
    deploy: {
        lambda: deployLambda,
    }
}
