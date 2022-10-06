import { aws } from "#env"

const syncWebsite = async (name, website) => {
    const s3site = await aws.s3.getBucketWebsite({ Bucket: name })

    const unchanged = (
        website?.index === s3site?.IndexDocument?.Suffix
        && website?.error === s3site?.ErrorDocument?.Suffix
    )
    if (unchanged === true) {
        console.log("Website unchanged")
        return
    }

    if (website === null) {
        console.log("Removing website")
        await aws.s3.deleteBucketWebsite({ Bucket: name })
        return
    }

    console.log("Updating website")

    const errorConfig =
        (website.error === undefined)
            ? {}
            : {
                ErrorDocument: { Suffix: website.error }
            }
    await aws.s3.putBucketWebsite({
        Bucket: name,
        WebsiteConfiguration: {
            IndexDocument: { Suffix: website.index },
            ...errorConfig,
        }
    })
}

export default syncWebsite
