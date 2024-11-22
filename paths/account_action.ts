import { CustomResponse } from "xenith";
import { getUser } from "./utils/Token";
import { getConnection } from "./utils/SQL";
import * as Xenith from "xenith";
import * as TokenUtils from "./utils/Token";
const AuthCB = require('./authcb');
const bcrypt = require('bcrypt'); // Password hashing
import { sendVerificationEmail } from './utils/Emailer';
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
                case 'verify-email':
                    await sendVerificationEmail(id, user.email);
                    break;
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
                    const targetUser = await connection.get('SELECT * FROM users WHERE id = ?', [id]);
                    if (!targetUser) {
                        return res.json({code: 404, error: 'User not found'});
                    }
                    
                    const refreshedUser = new TokenUtils.User(
                        targetUser.id,
                        targetUser.email,
                        targetUser.type,
                        AuthCB.generateUniqueID(),
                        targetUser.name,
                        targetUser.authed,
                        targetUser.profile_info,
                        targetUser.created_at
                    );

                    // First try to update assuming temp_password column exists
                    try {
                        await connection.run(
                            'UPDATE users SET password = ?, private_token = ?, temp_password = ? WHERE id = ?',
                            [bcrypt.hashSync("password", 10), refreshedUser.asToken(), true, id]
                        );
                    } catch (err) {
                        // If column doesn't exist, add it and retry the update
                        await connection.run('ALTER TABLE users ADD COLUMN temp_password BOOLEAN DEFAULT FALSE');
                        await connection.run(
                            'UPDATE users SET password = ?, private_token = ?, temp_password = ? WHERE id = ?',
                            [bcrypt.hashSync("password", 10), refreshedUser.asToken(), true, id]
                        );
                    }
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