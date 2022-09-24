import { STS, STSClient } from "@aws-sdk/client-sts"

import { wrap } from "./wrap.mjs"

const sts = wrap(
    STS,
    STSClient,
    {
    }
)

export default sts
