import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
import { getUser } from '../utils/Token';

interface Post {
    id: string;
}

export default {
    path: '/posts/:id/delete',
    method: 'GET',
    access: "LIMIT",
    execute: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.json({ code: 401, error: 'Unauthorized' });
        }

        try {
            const { id } = req.params;
            
            const user = await getUser(token);
            
            const connection = await SQL.getConnection();

            // Get current posts
            const userRow = await connection.get(
                'SELECT posts FROM users WHERE private_token = ?',
                [token]
            );

            if (!userRow?.posts) {
                return res.json({ code: 404, error: 'No posts found' });
            }

            let postsData = { posts: [] };
            try {
                postsData = JSON.parse(userRow.posts);
                if (!Array.isArray(postsData.posts)) {
                    postsData = { posts: [] };
                }
            } catch (e) {
                return res.json({ code: 500, error: 'Error parsing posts data' });
            }

            // Find and remove the post
            const postIndex = postsData.posts.findIndex((post: Post) => post.id === id);
            if (postIndex === -1) {
                return res.json({ code: 404, error: 'Post not found' });
            }

            // Remove post from array
            postsData.posts.splice(postIndex, 1);

            // Update database
            await connection.run(
                'UPDATE users SET posts = ? WHERE private_token = ?',
                [JSON.stringify(postsData), token]
            );

            return res.json({
                code: 200,
                message: 'Post deleted successfully',
                posts: postsData.posts
            });

        } catch (error) {
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
