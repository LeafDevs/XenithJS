const { decryptMessage, privateKey } = require("../../src/crypto");

// This is an example of how to create a post endpoint in the example folder.
// The endpoint will be accessible at http://127.0.0.1:3000/post

module.exports = {
    path: '/post',
    method: 'POST',
    execute: (req, res) => {
        res.json({ message: 'Hello World' });
        console.log(JSON.parse(decryptMessage(req.body as unknown as string, privateKey)));
    }
}