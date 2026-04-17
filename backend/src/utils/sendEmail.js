import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // If SMTP credentials are provided in .env, use them
    let transporterConfig;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporterConfig = {
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        };
    } else {
        // Dev mode without SMTP credentials logs the email content to console.
        transporterConfig = {
            jsonTransport: true
        };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const message = {
        from: `${'Emstrap'} <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.htmlMessage || `<p>${options.message}</p>`
    };

    const info = await transporter.sendMail(message);

    // If we're using jsonTransport (dev mode without real SMTP credentials), log it so we can click the link
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('=============================================');
        console.log('EMAIL SENT (DEV MODE - Check terminal output)');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('=============================================');
    }

    return info;
};

export default sendEmail;
