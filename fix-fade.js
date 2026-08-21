const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = s.replace(/<div class="product-card fade-up"/g, '<div class="product-card"');
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Removed fade-up from dynamic cards');
