const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = "480857385164-8bp7rlerec8cco0snv3n1sud7g8v6uos.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
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