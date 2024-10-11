import { EndpointManager } from '../main.ts';
const ep = new EndpointManager();

ep.GET('/', (req, res) => {
    res.send('Hello World');
});

ep.registerInPath(__dirname + '/endpoints');

ep.listen(3000);