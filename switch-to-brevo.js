const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const newTransporter = `const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});`;

server = server.replace(/const transporter = nodemailer\.createTransport\(\{[\s\S]*?socketTimeout: 5000\s*\}\);/, newTransporter);

// We should also change the error message to be more generic since it's not Gmail anymore
server = server.replace(/Faltan configurar EMAIL_USER y EMAIL_PASS en Railway/, 'Faltan configurar las credenciales de Brevo en Railway (EMAIL_USER y EMAIL_PASS)');

fs.writeFileSync('server.js', server, 'utf8');
console.log('Server updated to use Brevo SMTP');
