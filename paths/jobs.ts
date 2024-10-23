const SQL = require('./utils/SQL');

module.exports = {
    path: '/jobs',
    method: 'GET',
    access: "NO_LIMIT",
    execute: (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            SQL.getConnection().then(connection => {
                return connection.query('SELECT * FROM jobs');
            }).then(jobs => {
                const formattedJobs = jobs.map(job => ({
                    ...job,
                    tags: JSON.parse(job.tags.replace(/'/g, '"')) // Parse the string to an array
                }));
                res.json(formattedJobs);
            }).catch(err => {
                res.json({code: 500, error: 'Database error', details: err });
            });
        }
    }
}