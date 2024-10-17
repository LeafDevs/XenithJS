const SQL = require('./utils/SQL');

module.exports = {
    path: '/apps',
    method: 'GET',
    access: "NO_LIMIT",
    execute: (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token && TokenUtils.isTokenValid(token)) {
            SQL.getConnection().then(connection => {
                return connection.query('SELECT * FROM applications');
            }).then(applications => {
                res.json(applications);
            }).catch(err => {
                res.json({code: 500, error: 'Database error', details: err });
            });
        } else {
            res.json({code: 401, error: 'Unauthorized' });
        }
    }
}