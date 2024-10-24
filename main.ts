import { APIKey, EndpointManager, options } from 'xenith';
import * as SQL from './paths/utils/SQL';
const ep = new EndpointManager();

ep.registerInPath(__dirname + '/paths');

ep.set(options.api, true);

ep.set(options.encrypt, true);

ep.set(options.rateLimit, 10);

ep.IMAGES(__dirname + '/paths/uploads', "/uploads");
const loadApiKeys = async () => {
    try {
        const db = await SQL.getConnection();
        const apiKeys = await db.all('SELECT * FROM apikeys');
        let totalKeys = 0;
        for (const apiKey of apiKeys) {
            const key = new APIKey();
            key.setKey(apiKey.api_key);
            key.belongsTo(apiKey.user_id);
            totalKeys++;
        }
        console.log(`Loaded ${totalKeys} API Keys from the database`);
    } catch (err) {
        console.error('Error loading API Keys from the database:', err);
        throw new Error('Error loading API Keys: ' + err.message);
    }
};

ep.listen(3000, ()=> {
    console.log('Started Server on http://localhost:3000');
    setTimeout(loadApiKeys, 3000);
});