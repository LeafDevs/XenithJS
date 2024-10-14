module.exports = {
    path: '/',
    method: 'GET',
    execute: (req, res) => {
        res.html(__dirname + '/html/page.html');
        fetch('http://localhost:3000/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'aaronjschriver@gmail.com',
                password: '1234567'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        }); 
    }
}