import * as SQL from '../utils/SQL';

export default {
    path: '/verify-email',
    method: 'GET',
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const code = req.query.code;
        if (!code) {
            return res.json({ code: 400, error: 'Verification code is required' });
        }

        try {
            const connection = await SQL.getConnection();
            
            // Get verification code and check if it's valid
            const verification = await connection.get(
                'SELECT * FROM verification_codes WHERE code = ? AND expires_at > datetime("now")',
                [code]
            );

            if (!verification) {
                return res.json({ code: 400, error: 'Invalid or expired verification code' });
            }

            // Update user's verified status
            await connection.run(
                'UPDATE users SET verified = TRUE WHERE id = ?',
                [verification.user_id]
            );

            // Delete the used verification code
            await connection.run(
                'DELETE FROM verification_codes WHERE code = ?',
                [code]
            );

            // Clean up expired codes while we're here
            await connection.run(
                'DELETE FROM verification_codes WHERE expires_at <= datetime("now")'
            );

            return res.json({ code: 200, message: 'Email verified successfully' });
        } catch (err) {
            console.error('Verification error:', err);
            return res.json({ code: 500, error: 'Internal server error' });
        }
    }
};