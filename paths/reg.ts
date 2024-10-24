const { getConnection } = require('./utils/SQL'); // Updated to use getConnection directly
const TokenUtils = require('./utils/Token');
const Xenith = require('xenith');

module.exports = {
    path: '/register',
    method: 'POST',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body, Xenith.privateKey); // decrypt the data
        const regex = /"{\\"email\\":\\"(.*?)\\",\\"password\\":\\"(.*?)\\"}"/;
        const matches = decrypted.match(regex); // match the data with the regex.
        let data = {
            email: "",
            password: ""
        };
        if (matches) {
            data = {
                email: matches[1],
                password: matches[2]
            };
        } else {
            console.error('No matches found in decrypted string');
            return res.json({ code: 400, error: 'Internal Server Error' });
        }
        if (!data.email || !data.password) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }
        if (TokenUtils.isUserValid(data.email, data.password)) {
            return res.json({ code: 400, error: 'User already exists' });
        } else {
            try {
                const connection = await getConnection();
                await connection.run('INSERT INTO users (email, password, authed, type, uniqueID) VALUES (?, ?, ?, ?, ?)', [data.email, data.password, 'email', 'student', generateUniqueID()]);
                res.json({ code: 200, message: 'Registration successful' });
            } catch (err) {
                console.error(err);
                res.json({ code: 500, error: 'Internal Server Error' });
            }
        }
    }
}
