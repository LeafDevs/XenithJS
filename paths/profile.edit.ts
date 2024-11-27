
import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
import { getUser } from '../utils/Token';

export default {
    path: '/profile/edit',
    method: 'POST',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
            const data = JSON.parse(decrypted);

            if (!data.setting || !data.value) {
                return res.json({ code: 400, error: 'Setting and value are required' });
            }

            const user = await getUser(token);
            const connection = await SQL.getConnection();

            // Get current profile info
            const profileInfo = JSON.parse(user.profile_info || '{}');

            // Update the specified setting
            switch (data.setting) {
                case 'bio':
                    profileInfo.bio = data.value.trim();
                    break;
                case 'social_links':
                    profileInfo.social_links = data.value;
                    break;
                case 'portfolio':
                    profileInfo.portfolio = data.value.trim();
                    break;
                case 'resume':
                    profileInfo.resume = data.value.trim();
                    break;
                default:
                    return res.json({ code: 400, error: 'Invalid setting' });
            }

            // Update database
            await connection.run(
                'UPDATE users SET profile_info = ? WHERE private_token = ?',
                [JSON.stringify(profileInfo), token]
            );

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
