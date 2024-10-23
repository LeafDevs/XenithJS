const SQL = require('./SQL');

const isTokenValid = (token: string): boolean => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM tokens WHERE token = ?', [token]);
    }).then(tokens => {
        return tokens.length > 0;
    });
}

class User {
    constructor(public id: number, public email: string, public type: string, public uniqueID: string, public name: string, public authed: string, public settings: any, public created_at: string, public token?: string, public profile_info?: any) {}

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
        return token;
    }
    
}

const isUserValid = (email: string, password: string): boolean => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM users WHERE email = "?" AND password = ?', [email, password]);
    }).then(users => {
        return users.length > 0;
    });
}

const generateToken = (): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64');
}

const getUser = (email: string): User => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM users WHERE private_token = ?', [email]);
    }).then(users => {
        if (users.length === 0) {
            throw new Error('User not found');
        }
        const user = users[0];
        return new User(user.id, user.email, user.type, user.uniqueID, user.name, user.authed, user.profile_info || null, user.createdAt, user.private_token, user.profile_info);
    });
}

const updateProfilePicture = (token: string, image: string): Promise<string> => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM users WHERE private_token = ?', [token]).then(users => {
            if (users.length === 0) {
                throw new Error('User not found');
            }
            const user = users[0];
            const profileInfo = user.profile_info;
            profileInfo.profile_picture = image;
            return connection.query('UPDATE users SET profile_info = ? WHERE private_token = ?', [JSON.stringify(profileInfo), token]);
        });
    });
}

module.exports = {
    isTokenValid,
    isUserValid,
    getUser,
    generateToken,
    User,
    updateProfilePicture
}
