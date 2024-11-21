// Import required dependencies
const { getConnection } = require('./utils/SQL'); // Database connection utility
const TokenUtils = require('./utils/Token'); // User token management
const Xenith = require('xenith'); // Core framework
const { Data } = Xenith; // Data utilities from Xenith
const AuthCB = require('./authcb'); // Authentication callbacks
const bcrypt = require('bcrypt'); // Password hashing

module.exports = {
    path: '/register', // Route path for user registration
    method: 'POST', // HTTP method
    access: "NO_LIMIT", // No rate limiting on registration
    execute: async (req, res) => {
        // Decrypt the request data using Xenith's private key
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const data = JSON.parse(decrypted);

        // Validate required fields
        if (!data.email || !data.password || !data.name) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }

        // Check if user already exists
        if (await TokenUtils.isUserValid(data.email)) {
            return res.json({ code: 400, error: 'User already exists' });
        } else {
            try {
                // Create new user object with default student role
                const user = new TokenUtils.User(
                    null, // No ID yet - will be assigned by database
                    data.email,
                    'student', // Default role
                    AuthCB.generateUniqueID(), // Generate unique identifier
                    data.name,
                    'email', // Authentication method
                    null, // No additional data
                    null  // No additional data
                );

                // Get database connection
                const connection = await getConnection();

                // Hash the password with bcrypt (10 rounds)
                const hashedPassword = await bcrypt.hash(data.password, 10);

                // Insert new user into database
                await connection.run(
                    'INSERT INTO users (email, name, password, authed, type, uniqueID, private_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [data.email, data.name, hashedPassword, 'email', 'student', AuthCB.generateUniqueID(), user.asToken()]
                );

                // Return success response
                res.json({ code: 200, message: 'Registration successful' });

            } catch (err) {
                // Log error and return generic error message
                console.error(err);
                res.json({ code: 500, error: 'Internal Server Error' });
            }   
        }
    }
}
