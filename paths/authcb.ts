const { OAuth2Client } = require('google-auth-library');
const SQL = require('./utils/SQL');
const { Data } = require('xenith');
const TokenUtils = require('./utils/Token');

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

            // Store user info in database 
            SQL.getConnection().then(connection => {
                return connection.query('INSERT INTO users (email, name, authed, type, uniqueID, private_token) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE email = ?', 
                    [email, name, 'google', 'student', generateUniqueID(), TokenUtils.User.generateToken(), email]);
            }).then(() => {
                // Send a GET request to get the user token and finalize registration
                return fetch('http://localhost:3000/get_user_token_and_finialize_register?email=' + encodeURIComponent(email))
                    .then(response => response.json())
                    .then(data => {
                        if (data.token) {
                            res.redirect('http://localhost:5173/dash?token=' + encodeURIComponent(data.token));
                        } else {
                            throw new Error('Failed to get user token');
                        }
                    });
            }).catch(err => {
                console.error(err);
                res.json({ code: 500, error: 'Internal Server Error' });
            });
        } catch (error) {
            console.error('Error processing Google OAuth:', error);
            res.json({ code: 500, error: 'Authentication failed' });
        }
    }
};

function generateUniqueID() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
