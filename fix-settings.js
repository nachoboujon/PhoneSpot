const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = 'window.phoneSpotSettings = window.phoneSpotSettings || {};\n' + s;
s = s.replace(/document\.getElementById\('btn-logout'\)\.addEventListener/g, "const logoutBtn = document.getElementById('btn-logout');\nif (logoutBtn) logoutBtn.addEventListener");
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed settings undefined and logout button');
