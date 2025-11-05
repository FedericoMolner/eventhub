const nodemailer = require('nodemailer');
const config = require('../config/server.config');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || '"EventHub" <noreply@eventhub.com>',
                to,
                subject,
                html
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendWelcomeEmail(user) {
        const subject = 'Benvenuto su EventHub!';
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`;
        
        const html = await this.getEmailTemplate('welcome', {
            name: user.firstName,
            verificationUrl
        });

        return this.sendEmail(user.email, subject, html);
    }

    async sendPasswordResetEmail(user, resetToken) {
        const subject = 'Ripristino Password - EventHub';
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = await this.getEmailTemplate('resetPassword', {
            name: user.firstName,
            resetUrl
        });

        return this.sendEmail(user.email, subject, html);
    }

    async sendEventRegistrationConfirmation(user, event) {
        const subject = `Conferma registrazione: ${event.title}`;
        
        const html = await this.getEmailTemplate('eventRegistration', {
            name: user.firstName,
            eventTitle: event.title,
            eventDate: new Date(event.startDate).toLocaleDateString('it-IT'),
            eventTime: new Date(event.startDate).toLocaleTimeString('it-IT'),
            eventLocation: event.location,
            eventId: event.id
        });

        return this.sendEmail(user.email, subject, html);
    }

    async sendEventCancellationNotification(user, event) {
        const subject = `Evento Cancellato: ${event.title}`;
        
        const html = await this.getEmailTemplate('eventCancellation', {
            name: user.firstName,
            eventTitle: event.title,
            eventDate: new Date(event.startDate).toLocaleDateString('it-IT')
        });

        return this.sendEmail(user.email, subject, html);
    }

    async getEmailTemplate(templateName, data) {
        const templates = require('../utils/email-templates');
        const template = templates[templateName];
        
        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        return template(data);
    }
}

module.exports = new EmailService();