const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/has_email_user: !!process\.env\.EMAIL_USER,/g, `has_email_user: !!process.env.EMAIL_USER,\n        smtp_user_val: process.env.SMTP_USER,`);
fs.writeFileSync('server.js', s, 'utf8');
console.log('updated version endpoint');
