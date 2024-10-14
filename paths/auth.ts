const { Data } = require('xenith');
const Xenith = require('xenith');

module.exports = {
    path: '/auth',
    method: 'POST',
    execute: (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body, Xenith.privateKey);
        const data = eval('(' + decrypted + ')'); // Using eval to parse the string as JSON
        console.log(data);
        if(!data.email || !data.password) {
            res.json({code: 400, error: 'Email and password are required' });
            return;
        }
        if(isUserValid(data.email, data.password)) {
            const user = getUser(data.email);
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