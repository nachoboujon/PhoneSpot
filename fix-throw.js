const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(/if \(\!process\.env\.EMAIL_USER \|\| \!process\.env\.EMAIL_PASS\) \{[\s\S]*?\}\s*await transporter\.sendMail/, `if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Faltan configurar EMAIL_USER y EMAIL_PASS en Railway');
        }
        await transporter.sendMail`);

fs.writeFileSync('server.js', server, 'utf8');
console.log('Fixed error throwing');
