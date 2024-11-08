import { CustomResponse } from "xenith";
import { getUser } from "./utils/Token";
import { getConnection } from "./utils/SQL";
import * as Xenith from "xenith";

export default {
    path: '/admin/accounts/:id/:action',
    method: 'POST',
    access: 'LIMIT',
    execute: async (req, res: CustomResponse) => {
        try {
            const token = req.headers['authorization']?.split(' ')[1];
            const user = await getUser(token);
            if (!user) {
                return res.json({code: 401, error: 'Unauthorized' });
            }

            const { id, action } = req.params;
            const connection = await getConnection();

            switch (action) {
                case 'employer':
                    await connection.run(
                        'UPDATE users SET type = ? WHERE id = ?',
                        ['employer', id]
                    );
                    break;
                case 'admin':
                    await connection.run(
                        'UPDATE users SET type = ? WHERE id = ?',
                        ['admin', id]
                    );
                    break;
                case 'temp-password':
                    await connection.run(
                        'UPDATE users SET password = ? WHERE id = ?',
                        [Xenith.Data.hash('password'), id]
                    );
                    break;
                default:
                    return res.json({code: 400, error: 'Invalid action' });
            }

            res.json({code: 200, success: true });
        } catch (error) {
            console.error('Error performing account action:', error);
            res.json({code: 500, error: 'Internal server error' });
        }
    }
};