const { APIKey } = require('xenith');

const SQL = require('./utils/SQL');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/get_user_token_and_finalize_register', // Fixed spelling of 'finalize'
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

            let token = tokenUser.getToken();

            const [existingUser] = await connection.query('SELECT private_token FROM users WHERE email = ?', [email]);
            if (existingUser.private_token) {
                tokenUser.setToken(existingUser.private_token);
            } else {
                await connection.query('UPDATE users SET private_token = ? WHERE id = ?', [token, user.id]);
            }

            token = tokenUser.getToken();
            const apiKey = new APIKey();
            apiKey.belongsTo(token);

            await connection.query('INSERT INTO apikeys (api_key, user_id) VALUES (?, ?)', [apiKey.key, token]);

            res.json({ code: 200, token, apiKey: apiKey.key });
        } catch (error) {
            console.error('Error in get_user_token_and_finalize_register:', error);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
};
