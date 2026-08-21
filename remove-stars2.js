const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = s.replace(/<i class="fa-solid fa-star"><\/i>/g, '');
s = s.replace(/<i class="fa-solid fa-star-half-stroke"><\/i>/g, '');
s = s.replace(/<i class="fa-regular fa-star"><\/i>/g, '');
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Removed all stars');
