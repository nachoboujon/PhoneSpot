const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /<span style="\$\{isFreeShipping \? 'color:#555555; font-weight:bold;' : ''\}">\$\{isFreeShipping \? 'Gratis' : '\}<\/span>/g;
const replacement = `<span style="\${isFreeShipping ? 'color:#555555; font-weight:bold;' : ''}">\${isFreeShipping ? 'Gratis' : window.formatPrice(shippingCost)}</span>`;

s = s.replace(regex, replacement);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed syntax error');
