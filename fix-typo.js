const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = s.replace(/loadAdminData\(\);/g, 'window.loadAdminProducts();');
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed loadAdminProducts typo');
