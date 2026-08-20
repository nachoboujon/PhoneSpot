const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(/const paymentMethod = document\.querySelector\(''\)\.;/, "const paymentMethod = document.querySelector('input[name=\"payment_method\"]:checked')?.value || 'transferencia';");

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed paymentMethod');
