import { EndpointManager } from '../main.ts';
const ep = new EndpointManager();

ep.registerInPath(__dirname + '/endpoints');

ep.listen(3000);
