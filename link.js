const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = s.replace(/userIconLink\.href = '#';[^\n]*/, "userIconLink.href = 'perfil.html';");
fs.writeFileSync('public/script.js', s, 'utf8');
