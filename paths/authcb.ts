import { OAuth2Client } from 'google-auth-library';
import { Data } from 'xenith';
import * as TokenUtils from '../utils/Token';
import * as SQL from '../utils/SQL';

const CLIENT_ID = process.env.google_client_id;
const CLIENT_SECRET = process.env.google_client_secret;

const REDIRECT_URI = 'https://api.lesbians.monster/auth/google/callback';

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export default {
    path: '/auth/google/callback',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const { code } = req.query;
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);

            const userInfo = await oAuth2Client.request({
                url: 'https://www.googleapis.com/oauth2/v1/userinfo'
            });

            const { email, name } = userInfo.data as { email: string, name: string };

            const connection = await SQL.getConnection();
            await connection.run('INSERT INTO users (email, name, password, authed, type, uniqueID, private_token) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET email = ?', 
                [email, name, Data.hash(email), 'google', 'student', generateUniqueID(), TokenUtils.generateToken(), email]);

            const response = await fetch('https://api.lesbians.monster/get_user_token_and_finalize_register?email=' + encodeURIComponent(email));
            const data = await response.json();
            if (data.token) {
                res.redirect('http://jobs.lesbians.monster/dash?token=' + encodeURIComponent(data.token));
            } else {
                throw new Error('Failed to get user token');
            }
        } catch (error) {
            console.error('Error processing Google OAuth:', error);
            res.json({ code: 500, error: 'Authentication failed' });
        }
    },
    generateUniqueID() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};

export function generateUniqueID(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

