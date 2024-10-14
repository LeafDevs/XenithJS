// This is an example of how to create a root endpoint in the example folder.
// The endpoint will be accessible at http://127.0.0.1:3000/

module.exports = {
    path: '/',
    method: 'GET',
    execute: (req, res) => {
        res.send('Hello World');
    }
}