import { EndpointManager } from 'xenith';
const ep = new EndpointManager();

ep.registerInPath('paths');

ep.listen(3000, ()=> {
    console.log('Started Server on http://localhost:3000');
});