const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.google_client_id;
const CLIENT_SECRET = process.env.google_client_secret;

const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

module.exports = {
    path: '/auth/google',
    method: 'GET',
    access: "NO_LIMIT",
    execute: (req, res) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
        });
        res.redirect(authUrl);
    }
};