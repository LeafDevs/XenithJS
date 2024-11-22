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
        const userTokens = await db.all('SELECT * FROM users');
        let totalKeys = 0;
        let adminKeys = 0;
        for (const apiKey of apiKeys) {
            const key = new APIKey();
            key.setKey(apiKey.api_key);
            key.belongsTo(apiKey.user_id);
            totalKeys++;
        }
        for (const userToken of userTokens) {
            const key = new APIKey();
            key.setKey(userToken.private_token);
            key.belongsTo(userToken.id);
            if (userToken.type === 'admin') {
                key.setBypass(true);
                adminKeys++;
            }
            
            totalKeys++;
        }
        console.log(`Loaded ${totalKeys} API Keys from the database`);
        console.log(`${adminKeys} of them are bypass keys`);
    } catch (err) {
        console.error('Error loading API Keys from the database:', err);
        throw new Error('Error loading API Keys: ' + err.message);
    }
};

ep.listen(3000, ()=> {
    console.log('Started Server on https://api.lesbians.monster');
    setTimeout(loadApiKeys, 3000);
});