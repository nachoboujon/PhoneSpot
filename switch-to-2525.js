const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(/port: 587,/, 'port: 2525,');

fs.writeFileSync('server.js', server, 'utf8');
console.log('Server updated to use Brevo SMTP on port 2525');
