import { APIKey, EndpointManager, options } from 'xenith';
import * as SQL from './utils/SQL';
import path from 'path';
import ListFile from './utils/ListFile';

const ep = new EndpointManager();
const verifiedAccounts = new ListFile(path.join(__dirname, 'verified_accounts.list'), process.env.GMAIL_APP_PASSWORD || 'default-key');

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


ep.GET('/database', (req, res) => {
    res.html(path.join(__dirname, 'paths/html/database.html'));
});

ep.listen(3000, ()=> {
    console.log('Started Server on https://api.lesbians.monster');
    setTimeout(loadApiKeys, 3000);
});

// Add verification field to users table
const alterUsersTable = async () => {
    try {
        const db = await SQL.getConnection();
        await db.exec(`
            ALTER TABLE users 
            ADD COLUMN following TEXT DEFAULT '[]'
        `);
        console.log('Successfully added following column to users table');
    } catch (err) {
        // Column may already exist, ignore error
        if (!err.message.includes('duplicate column')) {
            console.error('Error altering users table:', err);
        }
    }
};

// Run the alteration
alterUsersTable();


export { verifiedAccounts };