// Import SQL utility for database operations
const SQL = require('./utils/SQL');

module.exports = {
    path: '/jobs', // Endpoint path
    method: 'GET', // HTTP method
    access: "NO_LIMIT", // No rate limiting on this endpoint
    execute: async (req, res) => {
        // Extract bearer token from Authorization header
        const token = req.headers['authorization']?.split(' ')[1];
        
        if (token) {
            try {
                // Get database connection
                const connection = await SQL.getConnection();
                
                // Fetch all accepted jobs from database
                const jobs = await connection.all('SELECT * FROM jobs WHERE accepted = "true"');
                
                // Validate jobs data is an array
                if (!Array.isArray(jobs)) {
                    throw new Error('Invalid jobs data returned from database');
                }

                // Format and sanitize each job's data
                const formattedJobs = jobs.map(job => {
                    try {
                        // Parse tags and questions from string to JSON
                        // Replace single quotes with double quotes for valid JSON
                        const parsedTags = JSON.parse(job.tags.replace(/'/g, '"'));
                        const parsedQuestions = JSON.parse(job.questions.replace(/'/g, '"'));
                        
                        return {
                            ...job,
                            tags: parsedTags,
                            questions: parsedQuestions
                        };
                    } catch (parseError) {
                        // Log parsing error and return job with empty arrays
                        console.error('Error parsing job data:', parseError);
                        return {
                            ...job,
                            tags: [],
                            questions: []
                        };
                    }
                });

                // Send formatted jobs as response
                res.json(formattedJobs);

            } catch (err) {
                // Log and return database errors
                console.error('Database error:', err);
                res.status(500).json({ code: 500, error: 'Database error', details: err });
            }
        } else {
            // Return unauthorized if no token provided
            res.status(401).json({ code: 401, error: 'Unauthorized' });
        }
    }
}