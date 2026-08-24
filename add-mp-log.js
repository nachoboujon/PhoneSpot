const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace("return res.status(400).json({ error: 'Error MP' });", "console.error('MP ERROR:', mpData); return res.status(400).json({ error: 'Error MP', details: mpData });");
fs.writeFileSync('server.js', s);
console.log('Added MP error logging');
