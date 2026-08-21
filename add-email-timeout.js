const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const oldTransporter = `const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});`;

const newTransporter = `const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
});`;

if (server.includes('auth: {') && !server.includes('connectionTimeout')) {
    server = server.replace(oldTransporter, newTransporter);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Timeouts added to Nodemailer');
}
