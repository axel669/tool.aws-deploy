import { S3, S3Client } from "@aws-sdk/client-s3"

import { wrap } from "./wrap.mjs"

const s3 = wrap(
    S3,
    S3Client,
    {
        getBucketAcl: {
            error: "NoSuchBucket",
            default: null
        },
        getBucketPolicy: {
            error: "NoSuchBucketPolicy",
            default: { Policy: null }
        },
        getBucketWebsite: {
            error: "NoSuchBucketWebsite",
            default: null
        },
        getObject: {
            error: "NoSuchKey",
            default: null
        },
    }
)

export default s3
