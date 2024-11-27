import * as nodemailer from 'nodemailer';
import { User } from './Token';
import * as SQL from './SQL';

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

interface Post {
    id: string;
    content: string;
    created_at: string;
    likes: number;
    comments: number; 
    shares: number;
    images?: string[];
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

    async sendPostNotification(post: Post, user: User): Promise<void> {
        try {
            const connection = await SQL.getConnection();

            // Get all users who follow this user
            const followers = await connection.all(
                'SELECT email, following FROM users WHERE JSON_EXTRACT(following, "$") LIKE ?',
                [`%${user.id}%`]
            );

            // Email template for post notification
            const emailTemplate = {
                subject: `${user.name} made a new post!`,
                html: `
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f7f7f7;">
                        <div style="max-width: 600px; margin: 20px auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 30px;">
                            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                                <img src="${user.profile_info?.profile_picture || 'https://github.com/leafdevs.png'}" 
                                     style="width: 48px; height: 48px; border-radius: 50%; margin-right: 15px;"
                                     alt="${user.name}'s profile picture">
                                <h2 style="color: #333333; margin: 0; font-size: 24px;">
                                    <span style="color: #0066cc;">${user.name}</span> just posted:
                                </h2>
                            </div>
                            <div style="padding: 25px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #0066cc; margin-bottom: 25px;">
                                <p style="color: #444444; font-size: 16px; line-height: 1.6; margin: 0;">
                                    ${post.content.length > 300 ? post.content.substring(0, 300) + '...' : post.content}
                                </p>
                                ${post.images?.length ? `
                                    <div style="margin-top: 15px;">
                                        <img src="${post.images[0]}" 
                                             style="max-width: 100%; height: auto; border-radius: 6px; margin-top: 10px;"
                                             alt="Post image preview">
                                        ${post.images.length > 1 ? `
                                            <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">
                                                +${post.images.length - 1} more image${post.images.length > 2 ? 's' : ''}
                                            </p>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eaeaea;">
                                    <p style="color: #666666; font-size: 14px; margin: 0;">
                                        ${new Date(post.created_at).toLocaleDateString()} • ${post.likes} likes • ${post.comments} comments
                                    </p>
                                </div>
                            </div>
                            <a href="${process.env.APP_URL}/profile/${user.id}" 
                               style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                                View Full Post
                            </a>
                            <p style="color: #999999; font-size: 12px; margin-top: 25px; text-align: center;">
                                You received this email because you follow ${user.name} on HHS Jobs Portal<br>
                                <a href="${process.env.APP_URL}/unfollow/${user.id}" style="color: #666666;">Unsubscribe from notifications</a>
                            </p>
                        </div>
                    </body>
                    </html>
                `
            };

            // Send email to each follower
            for (const follower of followers) {
                try {
                    await this.transporter.sendMail({
                        from: {
                            name: 'HHS Jobs Portal',
                            address: process.env.GMAIL_USER!
                        },
                        to: follower.email,
                        ...emailTemplate,
                        headers: {
                            'List-Unsubscribe': `<${process.env.APP_URL}/unsubscribe>`
                        }
                    });
                    console.log(`Notification email sent to ${follower.email}`);
                } catch (error) {
                    console.error(`Failed to send notification to ${follower.email}:`, error);
                }
            }

        } catch (error) {
            console.error('Failed to send post notifications:', error);
            throw error;
        }
    }
}


const emailer = new Emailer();

export const { sendVerificationEmail, verifyConnection } = emailer;
export default emailer;