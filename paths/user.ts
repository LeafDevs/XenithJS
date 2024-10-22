const SQL = require('./utils/SQL');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/user',
    method: 'GET',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const user = await TokenUtils.getUser(token);
            res.json({
                code: 200,
                name: user.name,
                type: user.type,
                email: user.email,
                uniqueID: user.uniqueID
            });
        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}

