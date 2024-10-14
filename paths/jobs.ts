const { getConnection } = require("./utils/SQL");

module.exports = {
    path: '/jobs',
    method: 'GET',
    execute: (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token && isTokenValid(token)) {
            getConnection().then(connection => {
                return connection.query('SELECT * FROM jobs');
            }).then(jobs => {
                res.json(jobs);
            }).catch(err => {
                res.status(500).json({ error: 'Database error', details: err });
            });
        }
    }
}