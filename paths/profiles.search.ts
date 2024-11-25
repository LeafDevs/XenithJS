import * as SQL from '../utils/SQL';

export default {
    path: '/search/profiles',
    method: 'GET',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        const query = req.query.q as string;
        if (!query || query.length < 3) {
            return res.json({ code: 400, error: 'Search query must be at least 3 characters' });
        }

        try {
            const connection = await SQL.getConnection();

            // Search users by name, with profile visibility check
            const users = await connection.all(`
                SELECT id, name, profile_info 
                FROM users 
                WHERE name LIKE ? 
                AND profile_visibility = TRUE
                LIMIT 10
            `, [`%${query}%`]);

            // Format response data
            const results = users.map(user => ({
                id: user.id,
                name: user.name,
                profile_info: JSON.parse(user.profile_info)
            }));

            return res.json(results);

        } catch (error) {
            console.error('Error searching profiles:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
