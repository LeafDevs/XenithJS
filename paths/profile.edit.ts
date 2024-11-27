
import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
import { getPassword, getUser } from '../utils/Token';
import bcrypt from 'bcrypt';
import * as TokenUtils from '../utils/Token';
import * as AuthCB from './authcb';

export default {
    path: '/profile/edit',
    method: 'POST',
    access: "LIMIT",
    execute: async (req, res) => {
        let token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
            const data = JSON.parse(decrypted);

            if (!data.setting || (!data.value && data.setting !== 'password') || (data.setting === 'password' && !data.newPassword)) {
                return res.json({ code: 400, error: 'Required fields are missing' });
            }

            const user = await getUser(token);
            if (!user) {
                return res.json({ code: 401, error: 'Unauthorized' });
            }
            const password = await getPassword(user.email);
            const connection = await SQL.getConnection();

            // Get current profile info
            const profileInfo = JSON.parse(user.profile_info || '{}');

            // Update the specified setting
            switch (data.setting) {
                case "twofa":
                    profileInfo.two_factor_auth = data.value;
                    break;
                case "password":
                    console.log(`Attempting password change for user ${user.email}`);
                    
                    if(!bcrypt.compareSync(data.currentPassword, password)) {
                        console.log(`Password change failed - incorrect current password for ${user.email}`);
                        return res.json({ code: 400, error: 'Current password is incorrect' });
                    }
                    
                    if(bcrypt.compareSync(data.newPassword, password)) {
                        console.log(`Password change failed - new password same as old for ${user.email}`);
                        return res.json({ code: 400, error: 'New password cannot be the same as the old password' });
                    }
                    
                    console.log('Creating refreshed user instance with new uniqueID');
                    // Create new user instance with refreshed uniqueID
                    const refreshedUser = new TokenUtils.User(
                        user.id,
                        user.email,
                        user.type,
                        AuthCB.generateUniqueID(),
                        user.name,
                        user.authed,
                        user.profile_info,
                        user.posting_id as unknown as string,
                        user.following as unknown as string[]
                    );
                    
                    const newToken = refreshedUser.asToken();
                    console.log(`Generated new token for user ${user.email}`);
                    
                    await connection.run('UPDATE users SET private_token = ? WHERE email = ?', [newToken, user.email]);
                    await connection.run('UPDATE users SET password = ? WHERE email = ?', [bcrypt.hashSync(data.newPassword, 10), user.email]);

                    console.log(`Updated token in database for ${user.email}`);
                    
                    profileInfo.password = bcrypt.hashSync(data.newPassword, 10);
                    console.log(`Password successfully changed for user ${user.email}`);
                    break;
                case 'bio':
                    if (!profileInfo.hasOwnProperty('bio')) {
                        profileInfo.bio = '';
                    }
                    profileInfo.bio = data.value.trim();
                    break;
                case 'social_links':
                    if (!profileInfo.hasOwnProperty('social_links')) {
                        profileInfo.social_links = [];
                    }
                    profileInfo.social_links = data.value;
                    break;
                case 'portfolio':
                    if (!profileInfo.hasOwnProperty('portfolio')) {
                        profileInfo.portfolio = '';
                    }
                    profileInfo.portfolio = data.value.trim();
                    break;
                case 'resume':
                    if (!profileInfo.hasOwnProperty('resume')) {
                        profileInfo.resume = '';
                    }
                    profileInfo.resume = data.value.trim();
                    break;
                default:
                    return res.json({ code: 400, error: 'Invalid setting' });
            }

            // Update database
            if (data.setting !== 'password') {
                await connection.run(
                    'UPDATE users SET profile_info = ? WHERE private_token = ?',
                    [JSON.stringify(profileInfo), token]
                );
            }

            return res.json({
                code: 200,
                message: 'Profile updated successfully',
                profile_info: profileInfo
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
