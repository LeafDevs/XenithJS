const SQL = require('./utils/SQL');

module.exports = {
    path: '/jobs',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const connection = await SQL.getConnection();
                const jobs = await connection.all('SELECT * FROM jobs WHERE accepted = "true"');
                if (!Array.isArray(jobs)) {
                    throw new Error('Invalid jobs data returned from database');
                }
                const formattedJobs = jobs.map(job => {
                    try {
                        const parsedTags = JSON.parse(job.tags.replace(/'/g, '"'));
                        const parsedQuestions = JSON.parse(job.questions.replace(/'/g, '"'));
                        return {
                            ...job,
                            tags: parsedTags,
                            questions: parsedQuestions
                        };
                    } catch (parseError) {
                        console.error('Error parsing job data:', parseError);
                        return {
                            ...job,
                            tags: [],
                            questions: []
                        };
                    }
                });
                res.json(formattedJobs);
            } catch (err) {
                console.error('Database error:', err);
                res.status(500).json({ code: 500, error: 'Database error', details: err });
            }
        } else {
            res.status(401).json({ code: 401, error: 'Unauthorized' });
        }
    }
}