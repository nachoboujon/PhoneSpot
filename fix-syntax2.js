const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(/if \(priceLabel\) priceLabel\.innerText = ';\s*/g, "if (priceLabel) priceLabel.innerText = window.formatPrice(maxPriceFilter);\n");

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed syntax error line 714');
