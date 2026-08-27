const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/has_email_user: !!process\.env\.EMAIL_USER/g, `has_email_user: !!process.env.EMAIL_USER,\n        smtp_host: process.env.SMTP_HOST || 'not-set'`);
fs.writeFileSync('server.js', s, 'utf8');
console.log('updated version endpoint');
