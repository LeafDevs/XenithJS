const { getConnection } = require('./utils/SQL'); // Updated to use getConnection directly
const TokenUtils = require('./utils/Token');
const Xenith = require('xenith');
const { Data } = Xenith;
const AuthCB = require('./authcb');

module.exports = {
    path: '/register',
    method: 'POST',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey); // decrypt the data
        const data = JSON.parse(decrypted);
        if (!data.email || !data.password || !data.name) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }
        if (await TokenUtils.isUserValid(data.email)) {
            return res.json({ code: 400, error: 'User already exists' });
        } else {
            try {
                const user = new TokenUtils.User(
                    null,
                    data.email,
                    'student',
                    AuthCB.generateUniqueID(),
                    data.name,
                    'email',
                    null,
                    null
                );
                const connection = await getConnection();
                await connection.run('INSERT INTO users (email, name, password, authed, type, uniqueID, private_token) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.email, data.name, Data.hash(data.password), 'email', 'student', AuthCB.generateUniqueID(), user.asToken()]);
                res.json({ code: 200, message: 'Registration successful' });
            } catch (err) {
                console.error(err);
                res.json({ code: 500, error: 'Internal Server Error' });
            }   
        }
    }
}
