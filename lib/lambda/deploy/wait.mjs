import { aws } from "#env"

import {
    waitUntilFunctionUpdated
} from "@aws-sdk/client-lambda"

export default (name) => waitUntilFunctionUpdated(
    {
        client: aws.lambda.client,
        delay: 2,
        maxWaitTime: 60
    },
    { FunctionName: name }
)
