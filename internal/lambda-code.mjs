import adm from "adm-zip"

const defaultCode = `exports.handler = async (event) => {
    return {
        statusCode: 200,
        body: "I'm a lambda!",
    }
}
`

const zip = new adm()

zip.addFile(
    `index.js`,
    Buffer.from(defaultCode, "utf8")
)

const ZipFile =  zip.toBuffer()

export default { ZipFile }
