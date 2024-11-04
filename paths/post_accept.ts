const Xenith = require("xenith");
const SQL = require("./utils/SQL");
const Token = require('./utils/Token');

module.exports = {
    path: "/accept_post",
    method: "POST",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const token = req.headers.authorization?.split(" ")[1];

        if(!token) {
            res.json({ code: 401, error: 'Unauthorized' });
        }

        if(Token.isAdmin(token)) {
            try {
                const json = JSON.parse(decrypted);
                const connection = await SQL.getConnection();
                if (!json.accepted) {
                    await connection.run('DELETE FROM jobs WHERE id = ?', [json.id]);
                    res.json({ code: 200, message: 'Job deleted successfully' });
                } else {
                    await connection.run('UPDATE jobs SET accepted = ? WHERE id = ?', ["true", json.id]);
                    res.json({code: 200, message: "Accepted Post"})
                }
            } catch(err) {
                res.json({code: 404, message: "Database Error: " + err})
            }
        } else {
            res.json({code: 404, message: "Not Found" })
        }    
    }
}