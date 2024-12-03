import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
export default {
    path: '/database/delete',
    method: 'POST',
    access: "NO_LIMIT", // Adjust access level as needed
    execute: async (req, res) => {
        const d = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey)); // Assuming the ID of the entry to delete is sent in the request body

        console.log(req.body);
        console.log(d.data);

        const data = JSON.parse(d.data);
        console.log(data);

        if (!data.id || !data.table) {
            return res.json({ code: 400, error: 'ID and table are required to delete an entry' });
        }

        try {
            const connection = await SQL.getConnection();
            // Table name cannot be parameterized, need to use template literal
            const result = await connection.run(`DELETE FROM ${data.table} WHERE id = ?`, [parseInt(data.id)]);

            if (result && result.changes && result.changes > 0) {
                res.json({ code: 200, message: 'Entry successfully deleted' });
            } else {
                res.json({ code: 404, error: 'Entry not found' });
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            res.json({ code: 500, error: 'Internal server error' });
        }
    }
}