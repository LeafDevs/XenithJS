// This is an example of how to create a page in the example folder.
// The page will be accessible at http://127.0.0.1:3000/page
// and will display the index.html file in the images folder.

module.exports = {
    path: '/page',
    method: 'GET',
    execute: (req, res) => {
        res.html(__dirname + '/../pages/index.html');
    }
}