import * as nodemailer from 'nodemailer';

interface EmailConfig {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
}

export class Emailer {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    static async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
        return emailer.sendVerificationEmail(email, verificationToken);
    }

    static async verifyConnection(): Promise<boolean> {
        return emailer.verifyConnection();
    }

    async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
        const verificationLink = `${process.env.APP_URL}/verify-email?code=${verificationToken}`;
        const emailConfig: EmailConfig = {
            to: email,
            subject: 'Verify your email',
            text: `Please click the link below to verify your email: ${verificationLink}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h1 style="color: #1a1a1a; margin-bottom: 20px;">Verify Your Email</h1>
                        <p style="color: #4a4a4a; margin-bottom: 20px;">
                            Thank you for registering! Please click the button below to verify your email address.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" 
                               style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Verify Email
                            </a>
                        </div>
                        <p style="color: #666666; font-size: 14px; margin-top: 20px;">
                            If the button doesn't work, copy and paste this link into your browser:
                            <br>
                            <a href="${verificationLink}" style="color: #0066cc; word-break: break-all;">
                                ${verificationLink}
                            </a>
                        </p>
                        <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 30px 0;">
                        <p style="color: #666666; font-size: 12px; text-align: center;">
                            This is an automated message from HHS Jobs Portal. Please do not reply to this email.
                        </p>
                    </div>
                </body>
                </html>
            `
        };

        try {
            console.log('Attempting to send verification email...');
            
            const info = await this.transporter.sendMail({
                from: {
                    name: 'HHS Jobs Portal',
                    address: process.env.GMAIL_USER!
                },
                ...emailConfig,
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high',
                    'List-Unsubscribe': `<${process.env.APP_URL}/unsubscribe>`
                }
            });

            console.log('Verification email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('Sent to:', email);
            console.log('With token:', verificationToken);
            console.log('Check the verification link would be:', verificationLink);

            // Log the full response for debugging
            console.log('Full email response:', info);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw error;
        }
    }

    async verifyConnection(): Promise<boolean> {
        try {
            const result = await this.transporter.verify();
            console.log('SMTP Connection verified:', result);
            return true;
        } catch (error) {
            console.error('SMTP Verification failed:', error);
            return false;
        }
    }
}

const emailer = new Emailer();

export const { sendVerificationEmail, verifyConnection } = emailer;
export default emailer;