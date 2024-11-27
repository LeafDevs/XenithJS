import { getConnection } from './SQL';

const isTokenValid = async (token: string): Promise<boolean> => {
    const connection = await getConnection();
    const tokens = await connection.all('SELECT * FROM tokens WHERE token = ?', [token]);
    return tokens.length > 0;
}

class User {
    constructor(public id: number,
                public email: string,
                public type: string,
                public uniqueID: string,
                public name: string,
                public authed: string,
                public settings: any,
                public created_at: string,
                public following: string[],
                public token?: string,
                public profile_info?: any,
                public posting_id?: number) {}

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

    setPostingID(id: number) {
        this.posting_id = id;
    }

    getFollowing(): string[] {
        return this.following;
    }
}

const isUserValid = async (email: string): Promise<boolean> => {
    const connection = await getConnection();
    const users = await connection.all('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0; // false
}

const generateToken = (): string => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64');
}

const getUser = async (email: string): Promise<User> => {
    const connection = await getConnection();
    const users = await connection.all('SELECT * FROM users WHERE private_token = ?', [email]);
    if (users.length === 0) {
        throw new Error('User not found');
    }
    const user = users[0];
    return new User(user.id, user.email, user.type, user.uniqueID, user.name, user.authed, user.profile_info || null, user.createdAt, user.following || [], user.private_token, user.profile_info, user.posting_id || null);
}

const getToken = async (email: string): Promise<string> => {
    const connection = await getConnection();
    const users = await connection.all('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
        throw new Error('User not found');
    }
    return users[0].private_token;
}

const updateProfilePicture = async (token: string, image: string): Promise<string> => {
    const connection = await getConnection();
    const user = await getUser(token);
    const profileInfo = user.profile_info ? JSON.parse(user.profile_info) : {};
    profileInfo.profile_picture = image;
    await connection.run('UPDATE users SET profile_info = ? WHERE private_token = ?', [JSON.stringify(profileInfo), token]);
    return image;
}

const updateBanner = async (token: string, image: string): Promise<string> => {
    const connection = await getConnection();
    const user = await getUser(token);
    const profileInfo = user.profile_info ? JSON.parse(user.profile_info) : {};
    profileInfo.banner = image;
    await connection.run('UPDATE users SET profile_info = ? WHERE private_token = ?', [JSON.stringify(profileInfo), token]);
    return image;
}

const getPassword = async (email: string): Promise<string> => {
    const connection = await getConnection();
    const users = await connection.all('SELECT * FROM users WHERE email = ?', [email]);
    return users[0].password;
}

const isAdmin = async(token: string): Promise<Boolean> => {
    return (await getUser(token)).type == 'admin';
}

export {
    isTokenValid,
    getUser,
    getToken,
    updateProfilePicture,
    getPassword,
    User,
    generateToken,
    isUserValid,
    updateBanner,
    isAdmin
}