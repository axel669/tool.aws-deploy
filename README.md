# AWS Deploy

## Commands
```bash
aws-deploy <env> <command> <...targets>

aws-deploy dev deploy
aws-deploy - deploy
```

`env` is the name of an environment optionally defined in the aws-deploy.yml
file, or `-` if no configured variables are needed.

- deploy
  > deploys the listed targets, or iterates over the deployment.resources list
  > if target is `all`
- list
  > lists the resources that have been deployed in the current environment based
  > on the tags provided in the config file
- validate-config
  > validates the config file without deploying any resources, and prints out
  > the json of the config with all environment variable interpolations

### Targets
Deploy targets are in the form `<service>:<id>`, where `service` is a service
prefix and `id` is the key within the config file in the resources.

| Service | Prefix |
| --- | --- |
| Lambda | lambda |
| S3 | s3 |
| API Gateway | apig |

## Config File
> Must be named `aws-deploy.yml`

Config file can use environment variables with `$${<system environment variable>}`.
Config file can use values from the front matter env with `$${.<env variable>}`.

Env vars will be interpolated for any string value (NOT keys). If the var
substitution results in the full value being `"undefined"`, it will be treated
as an empty value.

### Extra Environment Variables
aws-deploy will also add some environment variables automatically that can be
used in the configuration file.

| Name | Description |
| --- | --- |
| env | The environment name from the command |

```yaml
# front matter environments
---
dev:
  bucket:
    name: $${DEV_BUCKET}
live:
  bucket:
    name: $${PROD_BUCKET}
---

# AWS profile name
profile: default
# AWS region
region: us-west-1

# Lambda functions
lambda:
  # The key serves as the id for deployment targets
  first:
    # Lambda name. Full name in AWS will be prefix + name
    name: aws-test
    # Directory containing the code
    dir: first-func
    # Optional. Lambda runtime, check aws for valid values
    runtime: nodejs16.x
    # Optional. Lambda memory size in MB
    memory: 128
    # Optional. Lambda timeout in seconds
    timeout: 4
    # Optional. List of IAM policies (the Statement array)
    iam:
      - Effect: Allow
        Action:
          - s3:GetObject
          - s3:PutObject
        Resource:
          - "*"
    # Optional. Object of environment variables for the lambda
    env:
      tag: env/$${env}

# S3 buckets
s3:
  # The key serves as the id for deployment targets
  site:
    # Directory containing files to sync
    dir: source
    # Bucket name. Does not have prefix prepended
    name: $${.bucket.name}
    # optional prefix to use with the bucket keys
    prefix: stuff
    # optional access block settings to control if acl or policy block
    # is in place for the bucket
    # any key omitted in the object defaults to true (block public access)
    blockPublic:
      policy: false
      acl: true
    # optional bucket policy to apply
    policy:
    - Effect: Allow
      Principal: "*"
      Action:
      - s3:GetObject
      Resource: arn:aws:s3:::$${.bucket.name}/*
    # enable bucket website hosting. index entry is require, error is optional
    website:
      index: index.html
      error: 404.html

# API Gateway
apig:
  main:
    # name of the api
    name: "AWS Deploy Test"
    # stage to deploy to
    stage: $${env}
    stageVars:
      blep: old value
    # CORS settings for the api
    cors:
      origins:
      - "*"
      methods:
      - GET
      - POST
      headers:
      - cookie
      - content-type
      maxAge: 1000
      credentials: false
      expose:
      - date
    # authorizers
    auth:
      test:
        # currently only lambda authorizers are supports
        type: function
        # the key of a function defined in lambda, or the fully resolved name
        # of a lambda starting with "@" (ex: @some-external-function)
        func: auth
        cache: 0
        idSource:
        - $request.header.key
    # api integrations, but integrations is harder to type
    actions:
      postman-get:
        # only http and function currently supported
        type: http
        url: "https://postman-echo.com/get"
        method: "get"
      lambda-example:
        type: function
        func: first
        # version of lambda is optional
        version: 1
      site-index:
        type: http
        url: https://s3.us-west-1.amazonaws.com/{app}/index.html
        method: get
      site-files:
        type: http
        url: https://s3.us-west-1.amazonaws.com/{page}
        method: get
        # optionally set request parameter mappings using the format
        # [append|overwrite|remove]:[header|queryString|path].[name]: value
        requestParams:
          overwrite:header.host: $${.bucket.name}
    # api routes
    # method needs to be capitalized, and key needs to have any route variables
    # and/or proxy
    routes:
      "GET /":
        action: lambda-example
        auth: test
      "GET /{app}/static":
        action: site-index
      "GET /static/{page+}":
        action: site-files
      "POST /":
        action: postman-get

# Production deployment info
deployment:
  # Resources to deploy for production, uses the normal targets syntax
  resources:
    - "lambda:first"
    - "s3:site"
```
