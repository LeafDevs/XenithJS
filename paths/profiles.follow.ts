import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';

export default {
    path: '/follow/:id',
    method: 'POST',
    access: "LIMIT",
    execute: async (req, res) => {
        console.log('Received follow/unfollow request');
        
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            console.log('Request rejected: No authorization token provided');
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
        
            const decrytped = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
            const data = JSON.parse(decrytped);
            const { follow_id, action } = data;
            let id = follow_id;
            console.log(`Requested action: ${action}`);

            if (!id || !action || !['follow', 'unfollow'].includes(action)) {
                console.log('Request rejected: Invalid parameters', { id, action });
                return res.json({ code: 400, error: 'Invalid request parameters' });
            }

            const connection = await SQL.getConnection();
            console.log('Database connection established');

            // Get current user's following list
            const user = await connection.get(
                'SELECT following FROM users WHERE private_token = ?',
                [token]
            );

            if (!user) {
                console.log('Request rejected: User not found');
                return res.json({ code: 404, error: 'User not found' });
            }

            let following: string[] = [];
            try {
                following = JSON.parse(user.following);
                if (!Array.isArray(following)) {
                    console.log('Invalid following data format, resetting to empty array');
                    following = [];
                }
            } catch (e) {
                console.log('Error parsing following data, defaulting to empty array:', e);
                following = [];
            }

            // Update following list based on action
            if (action === 'follow' && !following.includes(id)) {
                console.log(`Adding user ${id} to following list`);
                following.push(id);
            } else if (action === 'unfollow') {
                console.log(`Removing user ${id} from following list`);
                following = following.filter(followId => followId !== id);
            }

            // Update database
            console.log('Updating following list in database');
            await connection.run(
                'UPDATE users SET following = ? WHERE private_token = ?',
                [JSON.stringify(following), token]
            );

            console.log('Following list updated in database', following);



            console.log(`Successfully ${action}ed user ${id}`);
            return res.json({
                code: 200,
                message: `Successfully ${action}ed user`,
                following
            });

        } catch (error) {
            console.error('Error updating follow status:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
