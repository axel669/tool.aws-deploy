import {
    ApiGatewayV2 as APIG,
    ApiGatewayV2Client as APIGClient,
} from "@aws-sdk/client-apigatewayv2"

import { wrap } from "./wrap.mjs"

const apig = wrap(
    APIG,
    APIGClient,
    {
    }
)

export default apig
