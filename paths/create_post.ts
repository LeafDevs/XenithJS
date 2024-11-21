// Import required modules
const Xenith = require("xenith");
const SQL = require("./utils/SQL");
const TokenUtils = require("./utils/Token");

module.exports = {
    path: "/create_post",
    method: "POST",
    execute: async (req, res) => {
        try {
            // Validate request body contains data
            if (!req.body.data) {
                return res.json({ code: 400, error: "Missing request data" });
            }

            // Extract and validate authorization token
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                return res.json({ code: 401, error: "No authorization token provided" });
            }

            // Decrypt and parse the request data
            let decryptedData;
            try {
                decryptedData = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey));
            } catch (err) {
                return res.json({ code: 400, error: "Invalid request data format" });
            }

            // Extract fields from decrypted data
            const { title, payrate, description, location, requirements, tags, icon, questions } = decryptedData;
            console.log(questions);

            // Validate required fields
            if (!title || !description || !payrate) {
                return res.json({ code: 400, error: "Missing required fields" });
            }

            // Get user information from token
            const user = await TokenUtils.getUser(token);
            if (!user) {
                return res.json({ code: 401, error: "Unauthorized" });
            }

            const userId = user.id;
            const company = user.name;

            try {
                // Connect to database and create new job posting
                const connection = await SQL.getConnection();
                const sanitizedQuestions = Array.isArray(questions) ? JSON.stringify(questions) : '[]';
                const post = await connection.run(
                    "INSERT INTO jobs (title, company, description, payrate, requirements, location, tags, icon, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [title, company, description, payrate, requirements, location, tags, icon, sanitizedQuestions]
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