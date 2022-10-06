import { aws } from "#env"

const putStage = async (apiID, stageName) => {
    const stage = await aws.apig.getStage({
        ApiId: apiID,
        StageName: stageName,
    })

    if (stage !== null) {
        return
    }

    await aws.apig.createStage({
        ApiId: apiID,
        StageName: stageName,
    })
}

export default async (api) => {
    const stageName = api.stage
    console.log(`Deploying to stage: ${stageName}`)
    await putStage(api.awsID, stageName)
    await aws.apig.createDeployment({
        ApiId: api.awsID,
        StageName: stageName,
    })
}
