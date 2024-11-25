const { getConnection } = require('../utils/SQL');

module.exports = {
    path: '/applications/job',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const connection = await getConnection();

                // Get user details using the token
                const userDetails = await connection.get(`
                    SELECT posting_id
                    FROM users
                    WHERE private_token = ?
                `, [token]);

                if (!userDetails || !userDetails.posting_id) {
                    console.log('No postings found for the user');
                    return res.json({ code: 404, error: 'No postings found for the user' });
                }

                const postingIds = JSON.parse(userDetails.posting_id);

                // Get applications for all posting IDs
                // Use parameterized queries
                const applications = await connection.all(`
                    SELECT id, user_id, job_id, status, questions, created_at
                    FROM applications 
                    WHERE job_id IN (${postingIds.map(() => '?').join(',')})
                `, postingIds);

                // Get job details for each application
                const formattedApplications = await Promise.all(applications.map(async (app) => {
                    const jobDetails = await connection.get(`
                        SELECT title, company, location, description, payrate, tags, icon, 
                               requirements, questions as questions, created_at as job_created_at, accepted
                        FROM jobs
                        WHERE id = ?
                    `, [app.job_id]);

                    const applicantDetails = await connection.get(`
                        SELECT name, profile_info
                        FROM users
                        WHERE private_token = ?
                    `, [app.user_id]);

                    try {
                        const parsedProfileInfo = JSON.parse(applicantDetails.profile_info);
                        return {
                            id: app.id,
                            applicantName: applicantDetails.name,
                            jobTitle: jobDetails.title,
                            company: jobDetails.company,
                            location: jobDetails.location,
                            description: jobDetails.description,
                            payrate: jobDetails.payrate,
                            tags: jobDetails.tags,
                            icon: jobDetails.icon,
                            requirements: jobDetails.requirements,
                            status: app.status,
                            questions: JSON.parse(jobDetails.questions.replace(/'/g, '"')),
                            answers: JSON.parse(app.questions.replace(/'/g, '"')),
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
                console.log(formattedApplications);
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