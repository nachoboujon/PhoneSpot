const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const oldSendEmail = s.substring(s.indexOf('const sendEmail = async'), s.indexOf('const authenticate =') - 1);

const newSendEmail = `const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.SMTP_PASS) {
            console.error('Falta SMTP_PASS (API Key de Resend)');
            return false;
        }
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.SMTP_PASS,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'PhoneSpot <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Email sent via Resend API:', data.id);
            return data;
        } else {
            console.error('Resend API Error:', data);
            return false;
        }
    } catch (err) {
        console.error('Error sending email:', err.message);
        return false;
    }
};
`;

s = s.replace(oldSendEmail, newSendEmail);
fs.writeFileSync('server.js', s, 'utf8');
console.log('Patched sendEmail to use Resend REST API');
