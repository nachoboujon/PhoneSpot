const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const testEndpoint = `
app.get('/api/test-email', async (req, res) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({ success: false, error: 'Faltan credenciales en Railway' });
        }
        const info = await transporter.sendMail({
            from: '"PhoneSpot" <' + process.env.EMAIL_USER + '>',
            to: process.env.EMAIL_USER,
            subject: 'Test de Diagnóstico Nodemailer',
            text: 'Si llega esto, el puerto SMTP está abierto en Railway.'
        });
        res.json({ success: true, info });
    } catch (err) {
        res.json({ success: false, error: err.message, stack: err.stack, code: err.code, syscall: err.syscall });
    }
});
`;

if (!server.includes('/api/test-email')) {
    server = server.replace(/app\.get\('\/api\/version'/g, testEndpoint + '\napp.get(\'/api/version\'');
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Test email endpoint added');
}
