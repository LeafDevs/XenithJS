const SQL = require('../utils/SQL');
const TokenUtils = require('../utils/Token');

module.exports = {
    path: '/user/:id',
    method: 'GET',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const { id } = req.params;
            const connection = await SQL.getConnection();
            const user = await connection.get('SELECT * FROM users WHERE id = ?', [id]);

            if (!user) {
                return res.json({ code: 404, error: 'User not found' });
            }

            res.json({
                code: 200,
                id: user.id,
                name: user.name,
                type: user.type,
                email: user.email,
                profile_info: JSON.parse(user.profile_info),
                created_at: user.created_at
                
            });
        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}

