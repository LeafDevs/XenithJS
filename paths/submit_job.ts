const SQL = require("./utils/SQL");
const Xenith = require("xenith");

// i do not know what this is used for. i think i made it but never used it.

module.exports = {
    path: "/jobs/submit",
    method: "POST",
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const { title, company, location, description, payrate, tags, icon, requirements, questions } = JSON.parse(Xenith.decryptMessage(req.body, Xenith.privateKey));

        if (!title || !company || !location || !payrate) {
            return res.json({ code: 400, error: 'Title, company, location, and payrate are required' });
        }

        try {
            const connection = await SQL.getConnection();
            const questionsJSON = Array.isArray(questions) && questions.length > 0 ? JSON.stringify(questions) : '[]';
            console.log(questionsJSON);
            await connection.run('INSERT INTO jobs (title, company, location, description, payrate, tags, icon, requirements, questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                [title, company, location, description || '', payrate, tags || '', icon || '', requirements || '', questionsJSON]);
            
            res.json({ code: 201, message: 'Job submitted successfully' });
        } catch (error) {
            console.error('Error submitting job:', error);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}