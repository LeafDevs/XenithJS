module.exports = {
    path: '/',
    method: 'GET',
    access: "NO_LIMIT",
    execute: (req, res) => {
        res.html(__dirname + '/html/page.html');
    }
}