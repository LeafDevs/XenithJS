import * as SQL from '../utils/SQL';

export default {
    path: '/posts/:id',
    method: 'GET',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const { id } = req.params;
            const connection = await SQL.getConnection();

            // Get user's posts
            const user = await connection.get(
                'SELECT posts FROM users WHERE id = ?',
                [id]
            );

            if (!user) {
                return res.json({ code: 404, error: 'User not found' });
            }

            let postsData = { posts: [] };
            if (user.posts) {
                try {
                    postsData = JSON.parse(user.posts);
                    if (!Array.isArray(postsData.posts)) {
                        postsData = { posts: [] };
                    }
                } catch (e) {
                    console.error('Error parsing posts:', e);
                }
            }

            return res.json(postsData.posts);

        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
