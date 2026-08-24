const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// 1. Fix 'token' to 'phoneSpotToken'
script = script.replace(/localStorage\.getItem\('token'\)/g, "localStorage.getItem('phoneSpotToken')");

// 2. Fix 'phonespot_token' to 'phoneSpotToken'
script = script.replace(/localStorage\.getItem\('phonespot_token'\)/g, "localStorage.getItem('phoneSpotToken')");

// 3. Fix 'role' to 'phoneSpotRole'
script = script.replace(/localStorage\.getItem\('role'\)/g, "localStorage.getItem('phoneSpotRole')");

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Standardized all localStorage auth keys to phoneSpotToken and phoneSpotRole');
