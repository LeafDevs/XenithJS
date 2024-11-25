import Emailer from "../utils/Emailer";

// Import required dependencies
import { getConnection } from '../utils/SQL'; // Database connection utility
import * as TokenUtils from '../utils/Token'; // User token management
import * as Xenith from 'xenith'; // Core framework
import * as bcrypt from 'bcrypt'; // Password hashing
import crypto from 'crypto';

const AuthCB = require('./authcb'); // Authentication callbacks
export default {
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
                    null as unknown as number, // No ID yet - will be assigned by database
                    data.email,
                    'student', // Default role
                    AuthCB.generateUniqueID(), // Generate unique identifier
                    data.name,
                    'email', // Authentication method
                    null as unknown as string, // No additional data
                    null as unknown as string // No additional data
                );

                const userToken = user.asToken();

                // Get database connection
                const connection = await getConnection();

                // Set verified status based on auth method
                const verified = data.auth_type === 'google';
                
                // Hash the password with bcrypt (10 rounds)
                const hashedPassword = await bcrypt.hash(data.password, 10);

                // Insert new user into database
                const result = await connection.run(
                    'INSERT INTO users (email, name, password, authed, type, uniqueID, private_token, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [data.email, data.name, hashedPassword, 'email', 'student', AuthCB.generateUniqueID(), userToken, verified]
                );

                if (!verified) {
                    // Generate verification code
                    const verificationCode = crypto.randomBytes(64).toString('hex');
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

                    // Store verification code
                    await connection.run(
                        'INSERT INTO verification_codes (code, user_id, expires_at) VALUES (?, ?, ?)',
                        [verificationCode, result.lastID, expiresAt.toISOString()]
                    );

                    // Send verification email
                    await Emailer.sendVerificationEmail(data.email, verificationCode);
                }

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
