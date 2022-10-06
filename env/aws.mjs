import config from "./config.mjs"
import awsService from "./aws-service.mjs"

const service = awsService({
    region: config.region,
    profile: config.profile ?? "default",
})

const aws = {
    apig: await service({
        name: "ApiGatewayV2",
        libName: "@aws-sdk/client-apigatewayv2",
        modify: {
            getStage: {
                error: "NotFoundException",
                default: null,
            }
        }
    }),
    iam: await service({
        name: "IAM",
        libName: "@aws-sdk/client-iam",
        modify: {
            getRole: {
                error: "NoSuchEntity",
                default: null
            },
            getRolePolicy: {
                error: "NoSuchEntity",
                default: null,
            },
        }
    }),
    lambda: await service({
        name: "Lambda",
        libName: "@aws-sdk/client-lambda",
        modify: {
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
            getPolicy: {
                error: "ResourceNotFoundException",
                default: null
            },
        }
    }),
    s3: await service({
        name: "S3",
        libName: "@aws-sdk/client-s3",
        modify: {
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
    }),
    sts: await service({
        name: "STS",
        libName: "@aws-sdk/client-sts",
        modify: {
        }
    }),
    tags: await service({
        name: "ResourceGroupsTaggingAPI",
        libName: "@aws-sdk/client-resource-groups-tagging-api",
        modify: {
        }
    }),
}

const identity = await aws.sts.getCallerIdentity()
aws.account = identity.Account
aws.region = config.region

export default aws
