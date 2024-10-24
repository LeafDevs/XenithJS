const { OAuth2Client } = require('google-auth-library');
const { Data } = require('xenith');
const TokenUtils = require('./utils/Token');
const SQL = require('./utils/SQL');

const CLIENT_ID = process.env.google_client_id;
const CLIENT_SECRET = process.env.google_client_secret;

const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

module.exports = {
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

            const { email, name } = userInfo.data;

            const connection = await SQL.getConnection();
            await connection.run('INSERT INTO users (email, name, password, authed, type, uniqueID, private_token) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET email = ?', 
                [email, name, Data.hash(email), 'google', 'student', generateUniqueID(), TokenUtils.generateToken(), email]);

            const response = await fetch('http://localhost:3000/get_user_token_and_finalize_register?email=' + encodeURIComponent(email));
            const data = await response.json();
            if (data.token) {
                res.redirect('http://localhost:5173/dash?token=' + encodeURIComponent(data.token));
            } else {
                throw new Error('Failed to get user token');
            }
        } catch (error) {
            console.error('Error processing Google OAuth:', error);
            res.json({ code: 500, error: 'Authentication failed' });
        }
    }
};

function generateUniqueID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}