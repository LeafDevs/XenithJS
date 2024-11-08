const Xenith = require("xenith");
const SQL = require("./utils/SQL");
const TokenUtils = require("./utils/Token");
module.exports = {
    path: "/create_post",
    method: "POST",
    execute: async (req, res) => {
        try {
            if (!req.body.data) {
                return res.json({ code: 400, error: "Missing request data" });
            }

            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                return res.json({ code: 401, error: "No authorization token provided" });
            }

            let decryptedData;
            try {
                decryptedData = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey));
            } catch (err) {
                return res.json({ code: 400, error: "Invalid request data format" });
            }

            const { title, payrate, description, location, requirements, tags, icon, questions } = decryptedData;
            console.log(questions);
            if (!title || !description || !payrate) {
                return res.json({ code: 400, error: "Missing required fields" });
            }
            const user = await TokenUtils.getUser(token);
            if (!user) {
                return res.json({ code: 401, error: "Unauthorized" });
            }

            const userId = user.id;
            const company = user.name;

            try {
                const connection = await SQL.getConnection();
                const post = await connection.run(
                    "INSERT INTO jobs (title, company, description, payrate, requirements, location, tags, icon, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [title, company, description, payrate, requirements, location, tags, icon, questions]
                );
                res.json({ 
                    code: 200, 
                    message: "Post created successfully", 
                    postId: post.id 
                });
            } catch (err) {
                res.json({ code: 500, error: "Failed to create post", details: err.message });
            }

        } catch (err) {
            res.json({ code: 500, error: "Internal server error", details: err.message });
        }
    }
}