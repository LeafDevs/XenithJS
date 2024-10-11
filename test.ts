const { EndpointManager } = require('./src/utils/Endpoint');

const endpointManager = new EndpointManager();

endpointManager.GET('/', (req, res) => {
    res.send('Hello World');
});

endpointManager.listen(3000);