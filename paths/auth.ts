const { Data } = require('xenith');
const Xenith = require('xenith');
const TokenUtils = require('./utils/Token');
const bcrypt = require('bcrypt');
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
            
            console.log(bcrypt.hashSync("password", 10));
            console.log(password);

            console.log(await bcrypt.compare(data.password, password));

            if (await bcrypt.compare(data.password, password)) {
                if(data.password === "password") {
                    res.json({code: 200, message: 'Authentication successful', temp: true });
                } else {
                    res.json({code: 200, message: 'Authentication successful', token: token });
                }
            } else {
                res.json({code: 401, error: 'Invalid email or password' });
            }
        } else {
            res.json({code: 401, error: 'Invalid email or password' });
        }
    }
}