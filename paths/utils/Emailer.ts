import * as https from 'https';

interface EmailConfig {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

class Emailer {
  private apiKey: string;

  constructor(config: {
    apiKey: string;
  }) {
    this.apiKey = config.apiKey;
  }

  async sendEmail(emailConfig: EmailConfig): Promise<void> {
    try {
      // Using Gmail API
      const data = JSON.stringify({
        raw: Buffer.from(
          `From: ${emailConfig.from}\r\n` +
          `To: ${Array.isArray(emailConfig.to) ? emailConfig.to.join(',') : emailConfig.to}\r\n` +
          `Subject: ${emailConfig.subject}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n\r\n` +
          `${emailConfig.html}`
        ).toString('base64')
      });

      const options = {
        hostname: 'gmail.googleapis.com',
        path: '/gmail/v1/users/me/messages/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': data.length
        }
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => responseData += chunk);
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(responseData);
            } else {
              reject(new Error(`Request failed with status ${res.statusCode}`));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });

    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}

// Create default instance with Gmail API
const defaultEmailer = new Emailer({
  apiKey: process.env.GMAIL_APP_PASSWORD
});

async function sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
  const verificationLink = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
  
  const emailConfig: EmailConfig = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 font-sans">
          <div class="max-w-2xl mx-auto p-8">
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
                <h1 class="text-3xl font-bold text-white">Email Verification</h1>
              </div>

              <!-- Content -->
              <div class="p-8 space-y-6">
                <p class="text-gray-800">Hello,</p>
                
                <p class="text-gray-700">
                  Thank you for registering with our service. To complete your registration and verify your email address, 
                  please click the button below:
                </p>

                <!-- Verification Button -->
                <div class="text-center py-4">
                  <a href="${verificationLink}" 
                     class="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg 
                            transition duration-300 ease-in-out transform hover:-translate-y-0.5">
                    Verify Email Address
                  </a>
                </div>

                <div class="space-y-4">
                  <p class="text-gray-700">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
                  <p class="text-blue-600 break-all bg-gray-50 p-4 rounded-lg text-sm">
                    ${verificationLink}
                  </p>
                </div>

                <div class="border-t border-gray-200 pt-6 mt-6">
                  <p class="text-gray-600 text-sm">
                    For security reasons, this verification link will expire in 24 hours.
                  </p>
                  <p class="text-gray-600 text-sm mt-4">
                    If you didn't request this verification, please ignore this email or contact our support team if you have concerns.
                  </p>
                </div>

                <div class="pt-6">
                  <p class="text-gray-700">
                    Best regards,<br>
                    <span class="font-semibold">Your Application Team</span>
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div class="bg-gray-50 px-6 py-4 text-center">
                <p class="text-gray-500 text-xs">
                  This is an automated message, please do not reply to this email.
                </p>
                <p class="text-gray-500 text-xs mt-2">
                  © ${new Date().getFullYear()} Your Application Name. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await defaultEmailer.sendEmail(emailConfig);
  } catch (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export {
  Emailer,
  defaultEmailer,
  type EmailConfig,
  sendVerificationEmail
};
