export default (...statements) => JSON.stringify({
    Version: "2012-10-17",
    Statement: statements,
})
