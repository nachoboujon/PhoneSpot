const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/smtp_host: process\.env\.SMTP_HOST \|\| 'not-set'/g, `smtp_host: process.env.SMTP_HOST || 'not-set',
        smtp_pass_length: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0`);
fs.writeFileSync('server.js', s, 'utf8');
console.log('updated version endpoint');
