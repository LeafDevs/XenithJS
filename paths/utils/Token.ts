const SQL = require('./SQL');

const isTokenValid = (token: string): boolean => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM tokens WHERE token = ?', [token]);
    }).then(tokens => {
        return tokens.length > 0;
    });
}

class User {
    constructor(public id: number, public email: string, public type: string, public uniqueID: string, public name: string, public authed: string, public settings: any, public created_at: string, public token?: string) {}

    isAdmin(): boolean {
        return this.type === 'admin';
    }

    isEmployer(): boolean {
        return this.type === 'employer';
    }

    isTeacher(): boolean {
        return this.type === 'teacher';
    }

    isStudent(): boolean {
        return this.type === 'student';
    }

    getID(): number {
        return this.id;
    }

    getEmail(): string {
        return this.email;
    }

    getType(): string {
        return this.type;
    }

    getUniqueID(): string {
        return this.uniqueID;
    }
    getToken(): string {
        return this.token || this.asToken();
    }

    setToken(token: string): void {
        this.token = token;
    }

    asToken(): string {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('base64');
        
        this.token = token;
        SQL.getConnection().then(connection => {
            return connection.query('INSERT INTO tokens (token, user_id) VALUES (?, ?)', [token, this.id]);
        }).catch(err => {
            console.error('Error storing token:', err);
        });
        return token;
    }

    static generateToken(): string {
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('base64');
    }
    
}

const isUserValid = (email: string, password: string): boolean => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM users WHERE email = "?" AND password = ?', [email, password]);
    }).then(users => {
        return users.length > 0;
    });
}

const getUser = (email: string): User => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM users WHERE email = ?', [email]);
    }).then(users => {
        if (users.length === 0) {
            throw new Error('User not found');
        }
        const user = users[0];
        return SQL.getConnection().then(connection => {
            return connection.query('SELECT * FROM settings WHERE user_id = ?', [user.id]);
        }).then(settings => {
            return new User(user.id, user.email, user.type, user.uniqueID, user.name, user.authed, settings[0] || null, user.createdAt, user.token);
        });
    });
}

module.exports = {
    isTokenValid,
    isUserValid,
    getUser
}