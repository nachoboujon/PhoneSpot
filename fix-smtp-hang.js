const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// 1. Force Nodemailer to use port 587 and secure:false to bypass some Railway firewall issues
const newTransporter = `const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
});`;

server = server.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?socketTimeout: 5000\s*\}\);/, newTransporter);

// 2. Add an absolute Promise.race timeout to sendEmail to ensure it NEVER hangs the request
const newSendEmail = `const sendEmail = async (to, subject, html) => {
    return Promise.race([
        new Promise(async (resolve, reject) => {
            try {
                if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                    return reject(new Error('Faltan configurar EMAIL_USER y EMAIL_PASS en Railway'));
                }
                await transporter.sendMail({
                    from: '"PhoneSpot" <' + process.env.EMAIL_USER + '>',
                    to,
                    subject,
                    html
                });
                console.log('Email sent to', to);
                resolve(true);
            } catch (err) {
                console.error('Error sending email:', err);
                reject(err);
            }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout enviando correo (Google SMTP no responde)')), 6000))
    ]);
};`;

server = server.replace(/const sendEmail = async \(to, subject, html\) => \{[\s\S]*?throw err;\s*\}\s*\};/, newSendEmail);

fs.writeFileSync('server.js', server, 'utf8');
console.log('Server updated with Port 587 and strict 6-second timeout');
