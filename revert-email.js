const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

const newSendEmail = `const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Faltan configurar las credenciales de email (EMAIL_USER y EMAIL_PASS)');
        }
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to', to, 'via Gmail/Nodemailer');
        return true;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};`;

lines.splice(84, 35, newSendEmail);

fs.writeFileSync('server.js', lines.join('\n'), 'utf8');
console.log('Reverted to Nodemailer via splice');
