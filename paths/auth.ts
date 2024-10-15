const { Data } = require('xenith');
const Xenith = require('xenith');
const TokenUtils = require('./utils/Token');
module.exports = {
    path: '/auth',
    method: 'POST',
    execute: async (req, res) => {
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