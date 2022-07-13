export default (...statements) => {
    if (statements.length === 0) {
        return null
    }
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: statements,
    })
}
