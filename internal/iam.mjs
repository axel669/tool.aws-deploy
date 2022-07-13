import { IAM, IAMClient } from "@aws-sdk/client-iam"

import {wrap} from "./wrap.mjs"

const iam = wrap(
    IAM,
    IAMClient,
    {
        getRole: {
            error: "NoSuchEntity",
            default: null
        },
        getRolePolicy: {
            error: "NoSuchEntity",
            default: null,
        },
    }
)

export default iam
