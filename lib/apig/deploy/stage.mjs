import { aws } from "#env"

const putStage = async (apiID, stageName) => {
    const stage = await aws.apig.getStage({
        ApiId: apiID,
        StageName: stageName,
    })

    if (stage !== null) {
        return
    }

    console.log("Creating stage")
    await aws.apig.createStage({
        ApiId: apiID,
        StageName: stageName,
    })
}

const putVars = async (apiID, stage, vars) => {
    console.log("Writing variables")
    await aws.apig.updateStage({
        ApiId: apiID,
        StageName: stage,
        StageVariables: vars,
    })
}

export default async (api) => {
    const stageName = api.stage
    console.group(`Configuring Stage: ${stageName}`)
    await putStage(api.awsID, stageName)
    await putVars(api.awsID, api.stage, api.stageVars)
    console.log("Deploying")
    await aws.apig.createDeployment({
        ApiId: api.awsID,
        StageName: stageName,
    })
    console.groupEnd()
}
