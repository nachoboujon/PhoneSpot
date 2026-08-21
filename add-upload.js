const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const uploadEndpoint = `app.post('/api/upload', authenticate, isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió imagen' });
    res.json({ url: '/uploads/' + req.file.filename });
});`;

if (!s.includes('/api/upload')) {
    s = s.replace(/app\.post\('\/api\/settings',/, uploadEndpoint + '\n\napp.post(\'/api/settings\',');
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Added /api/upload');
} else {
    console.log('Already has /api/upload');
}
