## 0.4.7
> Includes updates from versions I forgot to write changelogs for
- added front matter yaml environments
- added lambda env vars
- added api gateway cors
- added api gateway integration parameter mapping
- added bucket public access blocks
- added warning for not giving targets to deploy command
- added validation that all deploy targets are defined in the file before
    attempting to check aws
- removed env files

## 0.4.4
- s3 bucket acls disabled by default now
- s3 source dir now optional, no file sync if not defined

## 0.4.3
- went back to the older subsitution syntax, but now supported with the full
    string processing instead of the basic version it was in earlier versions
- removed the `prefix` config item, lambdas will now need full names

## 0.4.2
- bugfix in interpolation strings that were consuming aws variables
- bucket tagging working again

## 0.4.1
- updated joker to correct config validation bug

## 0.4.0
- changed top level config keys to match deploy command service keys
- improved variable injection rules (now allows injection into middle of values)
- changed api gateway `integrations` to `actions` to match the route terms
- changed order of api gateway changes to prevent weird issues with aws checking
    variables in routes coupled with actions
- updated readme docs

## 0.3.7
- added api gateway stage variables
- added support for prefixed files in s3 deployments

## 0.3.6
- output when searching aws resources
- fixed bug when deployment wasnt present where lambda alias udpate would throw
- report when args are not given instead of throwing errors
- API Gateway APIs can now be renamed

## pre 0.3.6
I didn't do changelogs here, sorry.
