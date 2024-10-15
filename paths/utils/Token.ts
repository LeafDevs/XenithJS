const SQL = require('./SQL');

const isTokenValid = (token: string): boolean => {
    return SQL.getConnection().then(connection => {
        return connection.query('SELECT * FROM tokens WHERE token = ?', [token]);
    }).then(tokens => {
        return tokens.length > 0;
    });
}

class User {
    constructor(public id: number, public email: string, public type: string, public uniqueID: string) {}

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
        return new User(users[0].id, users[0].email, users[0].type, users[0].uniqueID);
    });
}



module.exports = {
    isTokenValid,
    isUserValid,
    getUser
}