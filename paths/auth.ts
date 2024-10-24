const { Data } = require('xenith');
const Xenith = require('xenith');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/auth',
    method: 'POST',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body, Xenith.privateKey);
        const matches = JSON.parse(decrypted); // Assuming the decrypted string is a valid JSON
        let data = {
            email: "",
            password: ""
        };
        if (matches) {
            data = {
                email: matches.email,
                password: matches.password
            };
        } else {
            console.error('No matches found in decrypted string');
            res.json({code: 400, error: 'Internal Server Error' });
        }
        if(!data.email || !data.password) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }
        if (TokenUtils.isUserValid(data.email, data.password)) {
            const user = await TokenUtils.getUser(data.email);
            const base = {
                email: data.email,
                type: user.getType(),
                id: user.getID(),
                uniqueID: user.getUniqueID()
            }
            const token = Data.encrypt(new Data(base));
            res.json({ token });
        } else {
            res.json({code: 401, error: 'Invalid email or password' });
        }
    }
}