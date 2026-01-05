
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Verify connection configuration
        this.transporter.verify(function (error, success) {
            if (error) {
                console.error('Email Service Error:', error);
            } else {
                console.log('Email Service is ready to take our messages');
            }
        });
    }

    async sendOTP(to: string, otp: string) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Mobile CRM - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Password Reset Request</h2>
                    <p>You requested a password reset for your Mobile CRM account.</p>
                    <p>Your One-Time Password (OTP) is:</p>
                    <h1 style="color: #333; letter-spacing: 5px; background: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
                    <p>This OTP is valid for 10 minutes. Do not share this with anyone.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${to}`);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
}
