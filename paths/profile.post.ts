import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
import { v4 as uuidv4 } from 'uuid';
import { getUser } from '../utils/Token';
import fs from 'fs';
import path from 'path';
import Emailer from '../utils/Emailer';

interface Post {
    id: string;
    content: string;
    created_at: string;
    likes: number;
    comments: number;
    shares: number;
    images: string[];
}

interface PostsData {
    posts: Post[];
}

export default {
    path: '/posts',
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

            if (!data.content) {
                return res.json({ code: 400, error: 'Content is required' });
            }

            const user = await getUser(token);
            const connection = await SQL.getConnection();

            if (!user.isEmployer()) {
                return res.json({ code: 403, error: 'Only employers can create posts' });
            }


            // Get current posts
            const userRow = await connection.get(
                'SELECT posts FROM users WHERE private_token = ?',
                [token]
            );


            let postsData: PostsData = { posts: [] };
            if (userRow?.posts) {
                try {
                    postsData = JSON.parse(userRow.posts);
                    if (!Array.isArray(postsData.posts)) {
                        postsData = { posts: [] };
                    }
                } catch (e) {
                    console.error('Error parsing posts:', e);
                    postsData = { posts: [] };
                }
            }

            // Limit to 50 posts
            if (postsData.posts.length >= 50) {
                return res.json({ code: 400, error: 'Post limit reached (50 posts maximum)' });
            }

            // Handle image uploads
            const images: string[] = [];
            if (Array.isArray(data.images)) {
                const uploadsDir = path.join(__dirname, 'uploads');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir);
                }

                for (const base64Image of data.images) {
                    try {
                        // Extract base64 data
                        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
                        const buffer = Buffer.from(base64Data, 'base64');
                        
                        // Generate unique filename
                        const fileName = `${Date.now()}-${uuidv4()}.webp`;
                        const filePath = path.join(uploadsDir, fileName);

                        // Save image
                        const sharp = require('sharp');
                        await sharp(buffer)
                            .webp({ quality: 80 })
                            .toFile(filePath);

                        images.push(`https://api.lesbians.monster/uploads/${fileName}`);
                    } catch (err) {
                        console.error('Error saving image:', err);
                    }
                }
            }

            // Create new post
            const newPost: Post = {
                id: uuidv4(),
                content: data.content.trim(),
                created_at: new Date().toISOString(),
                likes: 0,
                comments: 0,
                shares: 0,
                images
            };


            // Send notification email to followers
            try {
                await Emailer.sendPostNotification(newPost, user);
            } catch (error) {
                console.error('Error sending notification email:', error);
            }

            // Add to beginning of posts array
            postsData.posts.unshift(newPost);

            // Update database
            await connection.run(
                'UPDATE users SET posts = ? WHERE private_token = ?',
                [JSON.stringify(postsData), token]
            );

            return res.json({
                code: 200,
                message: 'Post created successfully',
                post: newPost,
                posts: postsData.posts
            });

        } catch (error) {
            console.error('Error creating post:', error);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};
