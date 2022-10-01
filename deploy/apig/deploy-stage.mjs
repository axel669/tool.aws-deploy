import { svc } from "#env"

const ensureStage = async (apiID, stageName) => {
    const stage = await svc.apig.getStage({
        ApiId: apiID,
        StageName: stageName,
    })

    if (stage !== null) {
        return
    }

    await svc.apig.createStage({
        ApiId: apiID,
        StageName: stageName,
    })
}

export default async (api, apiID) => {
    const stageName = api.stage
    console.log(`Deploying to stage: ${stageName}`)
    await ensureStage(apiID, stageName)
    await svc.apig.createDeployment({
        ApiId: apiID,
        StageName: stageName,
    })
}
