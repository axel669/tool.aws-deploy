import { aws } from "#env"
import { logging } from "#internal"

import setup from "./deploy/setup.mjs"
import actions from "./deploy/actions.mjs"
import auths from "./deploy/auths.mjs"
import routes from "./deploy/routes.mjs"
import perms from "./deploy/perms.mjs"
import stage from "./deploy/stage.mjs"

const deployAPI = async (api) => {
    await setup(api)

    const awsActions = await aws.apig.getIntegrations({ ApiId: api.awsID })
    const awsAuths = await aws.apig.getAuthorizers({ ApiId: api.awsID })
    const awsRoutes = await aws.apig.getRoutes({ ApiId: api.awsID })

    await routes.cleanup(api, awsRoutes.Items)

    await actions.put(api, awsActions.Items)
    await auths.put(api, awsAuths.Items)
    await routes.put(api, awsRoutes.Items)

    await auths.cleanup(api, awsAuths.Items)
    await actions.cleanup(api, awsActions.Items)

    await perms.put(api, "actions")
    await perms.put(api, "auth")

    await perms.cleanup({
        api,
        items: awsActions.Items,
        type: "actions",
        idProp: "Description"
    })
    await perms.cleanup({
        api,
        items: awsAuths.Items,
        type: "auth",
        idProp: "Name"
    })

    await stage(api)
}

export default logging(
    (api) => `Deploying API '${api.name}'`,
    deployAPI
)
