const SQL = require('../utils/SQL')
const Xenith = require('xenith');

module.exports = {
    path: "/jobs/apply/:jobId",
    method: "POST",
    access: "LIMIT",
    async execute(req, res) {
        const { jobId } = req.params;
        console.log(`Received application request for job ID: ${jobId}`);

        const { answers } = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey));
        console.log('Decrypted answers:', answers);

        const token = req.headers.authorization.split(' ')[1];
        console.log('Auth token:', token);

        if(!token) {
            console.log('Request rejected: No auth token provided');
            return res.json({code: 401, })
        }

        if (!answers || !Array.isArray(answers)) {
            console.log('Request rejected: Invalid answers format', answers);
            return res.json({ code: 400,
                error: "Questions must be provided as an array"
            });
        }

        try {
            console.log('Attempting to insert application into database...');
            const connection = await SQL.getConnection();
            const sanitizedAnswers = Array.isArray(answers) ? JSON.stringify(answers) : '[]';
            const result = await connection.run(
                "INSERT INTO applications (user_id, job_id, status, questions) VALUES (?, ?, ?, ?)",
                [token, jobId, "pending", sanitizedAnswers]
            );

            console.log('Application successfully inserted with ID:', result.lastID);
            res.json({
                success: true,
                applicationId: result.lastID
            });

        } catch (error) {
            console.error("Error submitting application:", error);
            console.error("Error details:", error.stack);
            res.json({code: 500,
                error: "Failed to submit application"
            });
        }
    }
}