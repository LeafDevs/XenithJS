import { CustomResponse, Endpoint } from 'xenith';
import { getUser } from './utils/Token';
import { getConnection } from './utils/SQL';

export default {
    path: '/admin/accounts',
    method: 'GET',
    access: 'LIMIT',
    execute: async (req: Request, res: CustomResponse) => {
        try {
            const token = req.headers['authorization']?.split(' ')[1];
            const user = await getUser(token);
            if (!user) {
                return res.send('Unauthorized', 401);
            }

            if (user.type !== 'admin') {
                return res.send('Unauthorized', 401);
            }

            const accounts = await (await getConnection()).all('SELECT * FROM users');
            
            // Map accounts to remove sensitive information
            const sanitizedAccounts = accounts.map(account => ({
                id: account.id,
                name: account.name,
                email: account.email,
                type: account.type,
                authed: account.authed,
                token: account.token,
                profile_picture: JSON.parse(account.profile_info).profile_picture || null
            }));

            res.json({ accounts: sanitizedAccounts });
        } catch (error) {
            console.error('Error fetching accounts:', error);
            res.send('Internal server error', 500);
        }
    }
};