const SQL = require('./utils/SQL');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/get_user_token_and_finialize_register',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const { email } = req.query;

        if (!email) {
            return res.json({ code: 400, error: 'Email is required' });
        }

        try {
            const connection = await SQL.getConnection();
            const [user] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

            if (!user) {
                return res.json({ code: 404, error: 'User not found' });
            }

            const tokenUser = new TokenUtils.User(
                user.id,
                user.email,
                user.type,
                user.uniqueID,
                user.name,
                user.authed,
                user.settings,
                user.created_at
            );

            const token = tokenUser.asToken();

            // Update user's token in the database
            await connection.query('UPDATE users SET private_token = ? WHERE id = ?', [token, user.id]);

            // Insert into settings table if not exists
            await connection.query(
                'INSERT INTO settings (user_id, alerts, profile_visibility, profile_info) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = user_id',
                [user.id, true, true, JSON.stringify({profile_picture: "https://github.com/shadcn.png", bio: "This is a sample bio", social_links: {}}) ]
            );

            res.json({ code: 200, token });
        } catch (error) {
            console.error('Error in get_user_token_and_finialize_register:', error);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
};
