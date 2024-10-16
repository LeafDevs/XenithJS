import { EndpointManager, options } from 'xenith';
const ep = new EndpointManager();

ep.registerInPath(__dirname + '/paths');

ep.set(options.api, true);

ep.set(options.encrypt, true);

ep.set(options.rateLimit, 500);

ep.GET('/session', (req, res) => {
    res.json(req.session);
});

ep.listen(3000, ()=> {
    console.log('Started Server on http://localhost:3000');
});