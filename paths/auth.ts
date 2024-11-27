import { Data } from 'xenith';
import * as Xenith from 'xenith';
import * as TokenUtils from '../utils/Token';
import bcrypt from 'bcrypt';
import * as SQL from '../utils/SQL';
import Emailer from '../utils/Emailer';

// Map to store 2FA codes with email as key
const twoFactorCodes = new Map<string, string>();


export default {
    path: '/auth',
    method: 'POST', 
    access: "NO_LIMIT",
    execute: async (req, res) => {
        const decrypted = Xenith.decryptMessage(req.body.data, Xenith.privateKey);
        const data = JSON.parse(decrypted);
        console.log(data);
        if(data.code) {
            const storedCode = twoFactorCodes.get(data.email);
            console.log(storedCode);
            console.log(data.code);
            if (storedCode && storedCode === data.code) {
                const token = await TokenUtils.getToken(data.email);
                twoFactorCodes.delete(data.email); // Clean up used code
                return res.json({
                    code: 200,
                    message: 'Two-factor authentication successful',
                    token: token
                });
            } else {
                return res.json({
                    code: 401,
                    error: 'Invalid two-factor authentication code'
                });
            }
        }
        if(!data.email || !data.password) {
            return res.json({ code: 400, error: 'Email and password are required' });
        }
        if (await TokenUtils.isUserValid(data.email)) {
            const token = await TokenUtils.getToken(data.email);
            const password = await TokenUtils.getPassword(data.email);
            
            const connection = await SQL.getConnection();
            const user = await connection.get('SELECT verified, profile_info FROM users WHERE email = ?', [data.email]);
            const isVerified = user?.verified === 1;

            if (!isVerified) {
                return res.json({ code: 401, error: 'Please verify your email before logging in' });
            }

            const twoFA = JSON.parse(user.profile_info || '{}')?.two_factor_auth;
            console.log(twoFA);

            if (await bcrypt.compare(data.password, password)) {
                if(twoFA) {
                    res.json({code: 200, message: 'Authentication successful', twoFA: true });
                    const code = Math.random().toString(36).substring(2, 15);
                    twoFactorCodes.set(data.email, code);
                    console.log(twoFactorCodes);
                    Emailer.sendTwoFactorCode(data.email, code);
                } else {
                    if(data.password === "password") {
                        res.json({code: 200, message: 'Authentication successful', temp: true });
                    } else {
                        res.json({code: 200, message: 'Authentication successful', token: token });
                    }
                }
            } else {
                res.json({code: 401, error: 'Invalid email or password' });
            }
        } else {
            res.json({code: 401, error: 'Invalid email or password' });
        }
    }
}