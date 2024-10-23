const Xenith = require('xenith');
const SQL = require('./utils/SQL');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/register',
    method: 'POST',
    access: "NO_LIMIT",
    execute: (req, res) => {
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
            res.json({code: 400, error: 'Internal Server Error' });
        }
        if(!data.email || !data.password) {
            res.json({code: 400, error: 'Email and password are required' });
            return;
        }
        if(TokenUtils.isUserValid(data.email, data.password)) {
            res.json({code: 400, error: 'User already exists' });
            return;
        } else {
            SQL.getConnection().then(connection => {
                return connection.query('INSERT INTO users (email, password, authed, type, uniqueID) VALUES (?, ?, ?, ?, ?)', [data.email, data.password, 'email', 'student', generateUniqueID()]);
            }).then(() => {
                res.json({code: 200, message: 'Registration successful' });
            }).catch(err => {
                console.error(err);
                res.json({code: 500, error: 'Internal Server Error' });
            });
        }
    }
}


