module.exports = {
    path: '/register',
    method: 'POST',
    access: "NO_LIMIT",
    execute: (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body, Xenith.privateKey);
        const regex = /"{\\"email\\":\\"(.*?)\\",\\"password\\":\\"(.*?)\\"}"/;
        const matches = decrypted.match(regex);
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

function generateUniqueID(): any {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
