const { Data } = require('xenith');
const Xenith = require('xenith');
const TokenUtils = require('./utils/Token');

module.exports = {
    path: '/auth',
    method: 'POST', 
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const data = JSON.parse(decrypted); // Assuming the decrypted string is a valid JSON
        if(!data.email || !data.password) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }
        if (TokenUtils.isUserValid(data.email, data.password)) {
            const token = await TokenUtils.getToken(data.email);
            const password = await TokenUtils.getPassword(data.email);
            const pass = Data.hash(data.password);
            if(password === pass) {
                res.json({ code: 200, message: 'Authentication successful', token: token });
            } else {
                res.json({code: 401, error: 'Invalid email or password' });
            }
        } else {
            res.json({code: 401, error: 'Invalid email or password' });
        }
    }
}