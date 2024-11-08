import { CustomResponse } from "xenith";

import { getConnection } from './utils/SQL';
import * as TokenUtils from './utils/Token';
import * as Xenith from 'xenith';
import { Data } from 'xenith';

export default {
    path: '/reset-password',
    method: 'POST', 
    access: "NO_LIMIT",
    execute: async (req, res: CustomResponse) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const data = JSON.parse(decrypted);

        if (!data.email || !data.password || !data.newPassword) {
            return res.json({ code: 400, error: 'Email, current password and new password are required' });
        }

        try {
            const connection = await getConnection();
            const user = await connection.get('SELECT * FROM users WHERE email = ?', [data.email]);

            if (!user) {
                return res.json({ code: 404, error: 'User not found' });
            }

            if (Data.hash(data.password) !== user.password) {
                return res.json({ code: 401, error: 'Invalid current password' });
            }

            await connection.run('UPDATE users SET password = ? WHERE email = ?', 
                [Data.hash(data.newPassword), data.email]
            );

            res.json({ code: 200, message: 'Password updated successfully' });

        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}
