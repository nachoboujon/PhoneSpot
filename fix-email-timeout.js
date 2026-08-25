const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const oldSendEmail = /const sendEmail = async \(to, subject, html\) => \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\s*\};/m;

const newSendEmail = `const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Faltan configurar las credenciales de email (EMAIL_USER y EMAIL_PASS)');
            return false;
        }
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
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
        console.error('Error sending email:', err.message);
        return false;
    }
};`;

if (oldSendEmail.test(s)) {
    s = s.replace(oldSendEmail, newSendEmail);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Updated sendEmail to have timeouts and not throw');
} else {
    console.log('Regex failed');
}
