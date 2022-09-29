import { Lambda, LambdaClient } from "@aws-sdk/client-lambda"

import {wrap} from "./wrap.mjs"

const lambda = wrap(
    Lambda,
    LambdaClient,
    {
        getFunction: {
            error: "ResourceNotFoundException",
            default: null
        },
        createFunction: {
            error: "InvalidParameterValueException",
            message: "The role defined for the function cannot be assumed by Lambda.",
            default: null,
        },
        getAlias: {
            error: "ResourceNotFoundException",
            default: null
        },
    }
)

export default lambda
