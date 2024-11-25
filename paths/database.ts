import * as SQL from '../utils/SQL';

export default {
    path: '/api/database',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        try {
            const connection = await SQL.getConnection();
            // Get table names
            const tables = await connection.all(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `);

            // Get data from specified table or first table
            const tableName = req.query.table || tables[0]?.name;
            if (!tableName) {
                return res.json({ code: 404, error: 'No tables found' });
            }

            // Get table data with pagination
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const data = await connection.all(`
                SELECT * FROM ${tableName} 
                LIMIT ${limit} OFFSET ${offset}
            `);

            // Get total count for pagination
            const countResult = await connection.get(`
                SELECT COUNT(*) as total FROM ${tableName}
            `);

            return res.json({
                code: 200,
                data: {
                    tables,
                    currentTable: tableName,
                    rows: data,
                    pagination: {
                        total: countResult.total,
                        page,
                        limit
                    }
                }
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
}; 