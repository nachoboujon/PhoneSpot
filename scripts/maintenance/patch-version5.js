const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/smtp_pass_length: process\.env\.SMTP_PASS \? process\.env\.SMTP_PASS\.length : 0/g, `smtp_pass_length: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
        smtp_port: process.env.SMTP_PORT`);
fs.writeFileSync('server.js', s, 'utf8');
console.log('updated version endpoint');
