import nodemailer from 'nodemailer';
import logger from '../../config/logger';

// 1. Create a Transporter (The Postman)
// For Dev: We use Ethereal (Fake SMTP)
const createTransporter = async () => {
    // Check if we have production keys, otherwise generate test credentials
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            service: 'SendGrid', // or specific host/port
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
};

// 2. Generic Send Function
export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const transporter = await createTransporter();

        const info = await transporter.sendMail({
            from: '"Bidify Support" <no-reply@bidify.com>',
            to,
            subject,
            html,
        });

        logger.info(`Message sent: ${info.messageId}`);

        // Only for Ethereal: Print the URL to the console so you can preview the email
        if (process.env.NODE_ENV !== 'production') {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        logger.error('Error sending email:', error);
    }
};