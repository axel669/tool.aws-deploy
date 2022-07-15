# AWS Deploy

## Commands
```bash
aws-deploy <env-file> <command> <...targets>

aws-deploy dev.yml setup
aws-deploy dev.yml dev-deploy lambda:thing
aws-deploy - deploy
```

`env-file` is a path to a yml file with any set of values in it, or `-` for no
env file.

`command` is `setup`, `dev-deploy`, or `deploy`.
`dev-deploy` will deploy the given targets and nothing else.
`deploy` will deploy everything in the config.resources list, in the order
listed.

### Targets
Deploy targets are in the form `<service>:<id>`, where `service` is a service
prefix and `id` is the key within the config file in the resources.

| Service | Prefix |
| --- | --- |
| Lambda | lambda |
| S3 | s3 |

## Config File
> Must be named `aws-deploy.yml`

Config file can use environment variables with `$$<env-var>`.
Config file can use values from the env file with `$$.<env-file-var-path>`.

```yaml
profile: default
region: us-west-1
prefix: test_

# Configuration around all lambdas in project
lambda:
  # List of aliases to setup on each lambda at setup
  alias:
    - live
    - dev

# Lambda functions
functions:
  # The key serves as the id for deployment targets
  first:
    # Lambda name. Full name in AWS will be prefix + name
    name: aws-test
    # Directory containing the code
    dir: first-func
    # Lambda runtime, check aws for valid values
    runtime: nodejs16.x
    # Lambda memory size in MB
    memory: 128
    # Lambda timeout in seconds
    timeout: 4
    # List of IAM policies (the Statement array)
    iam:
      - Effect: Allow
        Action:
          - s3:GetObject
          - s3:PutObject
        Resource:
          - "*"

# S3 buckets
buckets:
  # The key serves as the id for deployment targets
  site:
    # Directory containing files to sync
    dir: source
    # Bucket name. Does not have prefix prepended
    name: $$.bucket.name

# Production deployment info
deployment:
  lambda:
    # Alias to update with the version of the lambda deployed
    updateAlias: live
    # Alias to create with the version of the lambda deployed
    newAlias: $$version
  # Resources to deploy for production, uses the normal targets syntax
  resources:
    - "lambda:first"
    - "s3:site"
```
