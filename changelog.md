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
