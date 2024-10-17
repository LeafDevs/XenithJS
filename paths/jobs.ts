const SQL = require('./utils/SQL');

module.exports = {
    path: '/jobs',
    method: 'GET',
    access: "LIMIT",
    execute: (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            SQL.getConnection().then(connection => {
                return connection.query('SELECT * FROM jobs');
            }).then(jobs => {
                res.json(jobs);
            }).catch(err => {
                res.json({code: 500, error: 'Database error', details: err });
            });
        }
    }
}