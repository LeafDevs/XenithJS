import { CustomResponse } from "xenith";

import { getConnection } from './utils/SQL';
import * as TokenUtils from './utils/Token';
import * as Xenith from 'xenith';
import { Data } from 'xenith';
const AuthCB = require('./authcb'); // Authentication callbacks
const bcrypt = require('bcrypt'); // Password hashing
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

            console.log(bcrypt.hashSync("password", 10));
            console.log(user.password);

            console.log(await bcrypt.compare(data.password, user.password));

            if (!await bcrypt.compare(data.password, user.password)) {
                return res.json({ code: 401, error: 'Invalid current password' });
            }

            // Create new user instance with refreshed uniqueID
            const refreshedUser = new TokenUtils.User(
                user.id,
                user.email,
                user.type,
                AuthCB.generateUniqueID(),
                user.name,
                user.authed,
                user.profile_info,
                user.posting_id
            );

            // Update password and token
            await connection.run('UPDATE users SET password = ?, private_token = ? WHERE email = ?', 
                [Data.hash(data.newPassword), refreshedUser.asToken(), data.email]
            );

            res.json({ 
                code: 200, 
                message: 'Password updated successfully',
                token: refreshedUser.asToken()
            });

        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}
