const TokenUtils = require("./utils/Token");
const SQL = require("./utils/SQL");

module.exports = {
    path: "/jobs/fetch_inactive",
    method: "GET",
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if(!token && TokenUtils.getUser(token).type != 'admin') {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        const connection = await SQL.getConnection();
        const jobs = await connection.all('SELECT * FROM jobs WHERE accepted = "false"');
        res.json({ code: 200, jobs: jobs });
    }
}