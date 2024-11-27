import * as SQL from '../utils/SQL';
import { getUser } from '../utils/Token';

export default {
    path: '/employers',
    method: 'GET',
    access: "LIMIT", 
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const connection = await SQL.getConnection();

            // Get all employer accounts
            const employers = await connection.all(`
                SELECT id, name, email, profile_info, created_at
                FROM users 
                WHERE type = 'employer'
                ORDER BY created_at DESC
            `);

            console.log(employers);

            // Format the response data
            const formattedEmployers = employers.map(employer => ({
                id: employer.id,
                name: employer.name,
                email: employer.email,
                profile_info: JSON.parse(employer.profile_info || '{}'),
                created_at: employer.created_at
            }));

            return res.json({
                code: 200,
                employers: formattedEmployers
            });

        } catch (error) {
            console.error('Error fetching employers:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
