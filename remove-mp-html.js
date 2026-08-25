const fs = require('fs');
let lines = fs.readFileSync('public/checkout.html', 'utf8').split('\n');

lines.splice(96, 13); // Removing lines 97 to 109

fs.writeFileSync('public/checkout.html', lines.join('\n'), 'utf8');
console.log('Removed Mercado Pago completely from checkout');
