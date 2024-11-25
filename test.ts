import emailer from '../utils/Emailer';

async function testVerificationEmail() {
    try {
        // Test email configuration
        const testEmail = 'aaronjschriver@gmail.com';
        const testToken = 'test-verification-token-123';

        // Verify SMTP connection first
        const isConnected = await emailer.verifyConnection();
        if (!isConnected) {
            console.error('Failed to connect to SMTP server');
            return;
        }

        console.log('Attempting to send verification email...');

        // Send test verification email
        await emailer.sendVerificationEmail(testEmail, testToken);

        console.log('Verification email sent successfully!');
        console.log('Sent to:', testEmail);
        console.log('With token:', testToken);
        console.log('Check the verification link would be:', `${process.env.APP_URL}/verify-email?token=${testToken}`);

    } catch (error) {
        console.error('Error sending verification email:', error);
    }
}

// Run the test
testVerificationEmail();
