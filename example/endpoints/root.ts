module.exports = {
    path: '/test',
    method: 'GET',
    execute: (req, res) => {
        res.send('Hello World');
    }
}