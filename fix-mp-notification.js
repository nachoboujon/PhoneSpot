const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.replace(/notification_url: 'https:\/\/phonespot\.site\/api\/mercadopago\/webhook',/g, '');

fs.writeFileSync('server.js', s);
console.log('Removed notification_url temporarily to test');
