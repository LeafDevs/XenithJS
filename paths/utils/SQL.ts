import mariadb from 'mariadb';

const createTables = async () => {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: 'localhost', // replace with your host
            user: 'root', // replace with your database username
            password: 'root', // replace with your database password
            database: 'fbla' // replace with your database name
        });
        await conn.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                description TEXT,
                payrate DECIMAL(10, 2) NOT NULL,
                tags TEXT,
                icon VARCHAR(255),
                requirements TEXT,
                questions JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                authed ENUM('email', 'google') NOT NULL,
                type ENUM('student', 'admin', 'employer', 'teacher') NOT NULL,
                uniqueID VARCHAR(255) NOT NULL UNIQUE,
                private_token VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                alerts BOOLEAN DEFAULT TRUE,
                profile_visibility BOOLEAN DEFAULT TRUE,
                profile_info JSON DEFAULT '{"profile_picture": "https://github.com/shadcn.png", "bio": "This is a sample bio", "social_links": {}}'
            );
        `);
        await conn.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                job_id INT NOT NULL,
                status ENUM('applied', 'interview', 'offered', 'rejected', 'accepted') DEFAULT 'applied',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            );
        `);
        await conn.query(`
            CREATE TABLE IF NOT EXISTS apikeys (
                api_key VARCHAR(255) NOT NULL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(private_token)
            );
        `);
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        if (conn) conn.close();
    }
};

createTables();

export const getConnection = async () => {
    let conn;
    try {
        conn = await mariadb.createConnection({
            host: 'localhost', // replace with your host
            user: 'root', // replace with your database username
            password: 'root', // replace with your database password
            database: 'fbla' // replace with your database name
        });
        return conn;
    } catch (err) {
        console.error('Database connection error:', err);
        throw new Error('Database connection error: ' + err.message);
    }
};
