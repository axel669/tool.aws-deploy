import crypto from "crypto"

import { S3 } from "@aws-sdk/client-s3"

const s3 = new S3({
})

// const info = await s3.headObject({
//     Bucket: "fulla-subsystem",
//     Key: "hermod",
// })

// console.log(info.ETag)
// console.log(
//     crypto.createHash("md5")
//         .update("mpvlxq00dmo5f113fn1lqzhlzbylub")
//         .digest("hex")
// )

const list = await s3.listObjectsV2({
    Bucket: "fulla-subsystem",
})

console.log(
    list.Contents
)
