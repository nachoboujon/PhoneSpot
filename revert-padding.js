const fs = require('fs');
let s = fs.readFileSync('public/producto.html', 'utf8');
s = s.replace('<div id="single-product-container" style="display:flex; justify-content:center; ">', '<div id="single-product-container" style="display:flex; justify-content:center; padding: 4rem;">');
fs.writeFileSync('public/producto.html', s, 'utf8');
console.log('Restored padding');
