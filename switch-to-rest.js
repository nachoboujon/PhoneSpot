const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// We will replace the entire sendEmail function and completely remove nodemailer since we are moving to a REST API approach
const restEmailFunction = `const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Faltan configurar las credenciales de Brevo en Railway (EMAIL_USER y EMAIL_PASS)');
        }
        
        // Brevo REST API (Bypasses all SMTP firewalls by using port 443)
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.EMAIL_PASS, // Brevo API/SMTP key
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "PhoneSpot", email: process.env.EMAIL_USER },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Brevo API Error:', errorData);
            throw new Error(errorData.message || 'Error en la API de Brevo');
        }

        console.log('Email sent to', to, 'via Brevo REST API');
        return true;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};`;

server = server.replace(/const sendEmail = async \(to, subject, html\) => \{[\s\S]*?throw err;\s*\}\s*\};\s*\}\);\s*\}\];\s*\};/, restEmailFunction);

// Wait, the previous replacement was messy due to Promise.race. Let's do a more robust replacement by finding the start of sendEmail and replacing up to the authenticate middleware
server = server.replace(/const sendEmail = async \(to, subject, html\) => \{[\s\S]*?(?=const authenticate =)/, restEmailFunction + '\n\n');

fs.writeFileSync('server.js', server, 'utf8');
console.log('Server updated to use Brevo REST API');
