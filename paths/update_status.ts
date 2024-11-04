const { getConnection } = require('./utils/SQL');
const Xenith = require("xenith")

module.exports = {
    path: '/applications/:applicationId/status',
    method: 'POST',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            try {
                const applicationId = parseInt(req.params.applicationId);
                const { status } = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey));

                if (!['pending', 'accepted', 'rejected'].includes(status)) {
                    return res.json({ code: 400, error: 'Invalid status' });
                }

                const connection = await getConnection();
                await connection.run(`
                    UPDATE applications 
                    SET status = ?
                    WHERE id = ?
                `, [status, applicationId]);

                res.json({ message: 'Application status updated successfully' });
            } catch (err) {
                console.error('Error updating application status:', err);
                res.json({ code: 500, error: 'Database error', details: err });
            }
        } else {
            console.log('Unauthorized request - no token provided');
            res.json({ code: 401, error: 'Unauthorized' });
        }
    }
}