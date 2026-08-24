const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

html = html.replace('value="efectivo" style="', 'value="efectivo" checked style="');

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('Made efectivo default');
