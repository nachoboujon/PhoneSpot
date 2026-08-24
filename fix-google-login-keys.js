const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// Fix Google Login setItem
script = script.replace(/localStorage\.setItem\('token', data\.token\);/g, "localStorage.setItem('phoneSpotToken', data.token);");
script = script.replace(/localStorage\.setItem\('role', data\.role\);/g, "localStorage.setItem('phoneSpotRole', data.role);");

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed Google Login localStorage keys');
