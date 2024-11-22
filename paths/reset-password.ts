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

        if (!data.email || !data.newPassword) {
            return res.json({ code: 400, error: 'Email and new password are required' });
        }

        try {
            const token = await TokenUtils.getToken(data.email);
            console.log(`Retrieved token for email ${data.email}`);
            
            const connection = await getConnection();
            console.log('Established database connection');

            // Check if temp password flag is set
            const userResult = await connection.get('SELECT temp_password, id, type, name, authed, profile_info, posting_id FROM users WHERE email = ?', [data.email]);
            
            if (!userResult || !userResult.temp_password) {
                console.log(`Password reset failed - no temp password flag for ${data.email}`);
                return res.json({ code: 401, error: 'Password reset not authorized' });
            }

            // Create new user instance with refreshed uniqueID
            const refreshedUser = new TokenUtils.User(
                userResult.id,
                data.email,
                userResult.type,
                AuthCB.generateUniqueID(),
                userResult.name,
                userResult.authed,
                userResult.profile_info,
                userResult.posting_id as unknown as string
            );
            console.log('Created refreshed user instance with new uniqueID');


            const newToken = refreshedUser.asToken();
            // Update password, token and reset temp_password flag
            const hashedNewPassword = bcrypt.hashSync(data.newPassword, 10);
            console.log('Generated hash for new password');
            
            await connection.run('UPDATE users SET password = ?, private_token = ?, temp_password = ? WHERE email = ?', 
                [hashedNewPassword, newToken, false, data.email]
            );
            console.log(`Updated password and token for user ${data.email}`);

            res.json({ 
                code: 200, 
                message: 'Password updated successfully',
                token: newToken
            });
            return console.log('Password reset successful');

        } catch (err) {
            console.error(err);
            res.json({ code: 500, error: 'Internal Server Error' });
        }
    }
}
