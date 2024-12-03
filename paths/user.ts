const SQL = require('../utils/SQL');
const TokenUtils = require('../utils/Token');

module.exports = {
    path: '/user',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        if (req.query.all !== undefined) {
            try {
                const connection = await SQL.getConnection();
                const users = await connection.all('SELECT * FROM users');
                
                // Map users to remove sensitive data
                const sanitizedUsers = users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    type: user.type,
                    profile_info: JSON.parse(user.profile_info || '{}'),
                    posting_id: user.posting_id,
                    following: user.following
                }));

                return res.json({
                    code: 200,
                    users: sanitizedUsers
                });
            } catch (err) {
                console.error('Error fetching all users:', err);
                return res.json({ code: 500, error: 'Failed to fetch users' });
            }
        }


        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const user = await TokenUtils.getUser(token);
            if (!user) {
                return res.json({ code: 401, error: 'No user found' });
            }
            res.json({
                code: 200,
                id: user.id,
                name: user.name,
                type: user.type,
                email: user.email,
                uniqueID: user.uniqueID,
                profile_info: JSON.parse(user.profile_info),
                posting_id: user.posting_id,
                following: user.following
            });
            console.log(user.following);
        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}

