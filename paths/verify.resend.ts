import Emailer from "../utils/Emailer";
import * as SQL from '../utils/SQL';
import * as Xenith from 'xenith';
import crypto from 'crypto';

export default {
    path: '/resend-verification',
    method: 'POST',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        try {
            // Decrypt and parse request data
            const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
            const data = JSON.parse(decrypted);

            if (!data.email) {
                return res.json({ code: 400, error: 'Email is required' });
            }

            const connection = await SQL.getConnection();

            // Get user
            const user = await connection.get(
                'SELECT id, verified FROM users WHERE email = ?',
                [data.email]
            );

            if (!user) {
                return res.json({ code: 404, error: 'User not found' });
            }

            if (user.verified) {
                return res.json({ code: 400, error: 'Email is already verified' });
            }

            // Delete any existing verification codes for this user
            await connection.run(
                'DELETE FROM verification_codes WHERE user_id = ?',
                [user.id]
            );

            // Generate new verification code
            const verificationCode = crypto.randomBytes(64).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

            // Store new verification code
            await connection.run(
                'INSERT INTO verification_codes (code, user_id, expires_at) VALUES (?, ?, ?)',
                [verificationCode, user.id, expiresAt.toISOString()]
            );

            // Send new verification email
            await Emailer.sendVerificationEmail(data.email, verificationCode);

            return res.json({ 
                code: 200, 
                message: 'Verification email resent successfully' 
            });

        } catch (error) {
            console.error('Error resending verification:', error);
            return res.json({ 
                code: 500, 
                error: 'Failed to resend verification email' 
            });
        }
    }
};
