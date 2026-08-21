const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

if (!server.includes('/api/version')) {
    server = server.replace(/app\.post\('\/api\/register'/g, `
app.get('/api/version', (req, res) => {
    res.json({ version: '1.0.5', status: 'El servidor está corriendo el código más nuevo con la doble verificación.' });
});

app.post('/api/register'`);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Version endpoint added');
}
