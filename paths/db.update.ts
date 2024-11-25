import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';

export default {
    path: '/api/database/update',
    method: 'POST',
    access: 'NO_LIMIT',
    execute: async (req, res) => {
        try {
            const decrypted = JSON.parse(Xenith.decryptMessage(req.body.data, Xenith.privateKey)).data;
            console.log(decrypted);
            if (!decrypted.table || !decrypted.id || !decrypted.column || !decrypted.value) {
                throw new Error('Missing required fields');
            }
            
            const { table, id, column, value } = decrypted;
            const connection = await SQL.getConnection();
            
            if (typeof table !== 'string' || typeof column !== 'string') {
                throw new Error('Table and column must be strings');
            }

            const escapedTable = `"${table.replace(/"/g, '""')}"`;
            const escapedColumn = `"${column.replace(/"/g, '""')}"`;
            
            await connection.run(`
                UPDATE ${escapedTable}
                SET ${escapedColumn} = ?
                WHERE rowid = ?
            `, [value, id]);

            return res.json({ code: 200, message: 'Updated successfully' });
        } catch (error) {
            console.error('Update error:', error);
            return res.json({ code: 500, error: 'Update failed' });
        }
    }
}