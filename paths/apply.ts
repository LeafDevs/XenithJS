module.exports = {
    path: "/apply",
    method: "POST",
    access: "LIMITED",
    handler: async (req, res) => {
        res.send("Hello, world!");
    }
}