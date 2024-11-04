const { getConnection } = require('./utils/SQL');

module.exports = {
    path: '/applications/job',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const connection = await getConnection();
                const { jobId } = req.query;

                // Get applications
                const applications = await connection.all(`
                    SELECT id, user_id, job_id, status, questions, created_at
                    FROM applications 
                    WHERE job_id = ?
                `, [jobId]);

                // Get job details
                const jobDetails = await connection.get(`
                    SELECT title, company, location, description, payrate, tags, icon, 
                           requirements, questions as job_questions, created_at as job_created_at, accepted
                    FROM jobs
                    WHERE id = ?
                `, [jobId]);

                // Get user details for each application
                const formattedApplications = await Promise.all(applications.map(async (app) => {
                    const userDetails = await connection.get(`
                        SELECT name, profile_info
                        FROM users
                        WHERE private_token = ?
                    `, [app.user_id]);

                    try {
                        const parsedQuestions = JSON.parse(app.questions.replace(/'/g, '"'));
                        const parsedProfileInfo = JSON.parse(userDetails.profile_info);
                        return {
                            id: app.id,
                            applicantName: userDetails.name,
                            jobTitle: jobDetails.title,
                            company: jobDetails.company,
                            location: jobDetails.location,
                            description: jobDetails.description,
                            payrate: jobDetails.payrate,
                            tags: jobDetails.tags,
                            icon: jobDetails.icon,
                            requirements: jobDetails.requirements,
                            status: app.status,
                            questions: parsedQuestions,
                            jobQuestions: jobDetails.job_questions,
                            createdAt: app.created_at,
                            jobCreatedAt: jobDetails.job_created_at,
                            accepted: jobDetails.accepted,
                            profile_picture: parsedProfileInfo.profile_picture
                        };
                    } catch (parseError) {
                        console.error(`Error parsing data for application ${app.id}:`, parseError);
                        throw parseError;
                    }
                }));

                res.json(formattedApplications);
            } catch (err) {
                console.error('Database error:', err);
                console.error('Stack trace:', err.stack);
                res.json({ code: 500, error: 'Database error', details: err.message });
            }
        } else {
            console.log('Unauthorized request - no token provided');
            res.json({ code: 401, error: 'Unauthorized' });
        }
    }
}