import { sendVerificationEmail } from './paths/utils/Emailer';

async function sendTestEmail() {
    try {
        await sendVerificationEmail('vincent@rossettiphoto.com', 'fatjuicy-big-dick123');
        console.log('Test verification email sent successfully');
    } catch (error) {
        console.error('Failed to send test email:', error);
    }
}

sendTestEmail();
