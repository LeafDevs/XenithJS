import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const dbPromise = open({
    filename: './fbla.db', // SQLite database file
    driver: sqlite3.Database
});

const createOrUpdateTables = async () => {
    const db = await dbPromise;

    // Create or update jobs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            description TEXT,
            payrate REAL NOT NULL DEFAULT 0.00,
            tags TEXT DEFAULT '',
            icon TEXT DEFAULT '',
            requirements TEXT DEFAULT '',
            questions TEXT DEFAULT '[]',
            accepted TEXT DEFAULT 'false',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
    // Create or update users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            authed TEXT CHECK(authed IN ('email', 'google')) NOT NULL,
            type TEXT CHECK(type IN ('student', 'admin', 'employer', 'teacher')) NOT NULL,
            uniqueID TEXT NOT NULL UNIQUE,
            private_token TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            alerts BOOLEAN DEFAULT TRUE,
            profile_visibility BOOLEAN DEFAULT TRUE,
            profile_info TEXT DEFAULT '{"profile_picture": "https://github.com/leafdevs.png", "bio": "This is a sample bio", "social_links": {}, "portfolio": "", "resume": ""}'
        );
    `);
    
    // Create or update applications table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            job_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('applied', 'interview', 'offered', 'rejected', 'accepted')) DEFAULT 'applied',
            questions TEXT NOT NULL DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(private_token),
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
    `);
    
    // Create or update apikeys table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS apikeys (
            api_key TEXT NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(private_token)
        );
    `);
    
    // Create or update pending_posts table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS pending_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(private_token)
        );
    `);
};

createOrUpdateTables();

// Export the database connection
export const getConnection = async () => {
    return dbPromise;
};
