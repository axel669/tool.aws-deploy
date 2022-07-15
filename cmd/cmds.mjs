import setupLambda from "./setup/lambda.mjs"
import setupBucket from "./setup/s3.mjs"

import deployLambda from "./deploy/lambda.mjs"
import deployS3 from "./deploy/s3.mjs"

export default {
    setup: {
        lambda: setupLambda,
        s3: setupBucket,
    },
    deploy: {
        lambda: deployLambda,
        s3: deployS3,
    }
}
