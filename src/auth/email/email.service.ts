import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    constructor(private readonly configService: ConfigService) { }

    private emailTransport() {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        if (isProduction) {
            return nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587, // Changed from 465
                secure: false, // Must be false for 587 (uses STARTTLS)
                requireTLS: true, // Forces encryption
                auth: {
                    user: this.configService.get<string>('EMAIL_USER'),
                    pass: this.configService.get<string>('EMAIL_PASSWORD'),
                }
            });
        }

        // Local development bypass for your Windows DNS issue
        return nodemailer.createTransport({
            host: '108.177.96.109',
            port: 465,
            secure: true,
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD'),
            },
            tls: {
                servername: 'smtp.gmail.com',
            }
        });
    }

    async sendVerificationCode(email: string, code: number) {
        console.log('################################\n trying to send email:');
        const transporter = this.emailTransport();
        const mailOptions = {
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Your Verification Code',
            text: `Your verification code is: ${code} \n This code will expire in 10 minutes.`,
        };
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully!');
        } catch (err) {
            console.log('################################\nError sending email:', err);
        }
    }
}