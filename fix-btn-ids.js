const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

html = html.replace('id="btnNext"', 'id="btn-next-step"');
html = html.replace('id="btnPrev"', 'id="btn-prev-step"');

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('Fixed button IDs to match script.js expectation');
