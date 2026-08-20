const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
const lines = s.split('\n');

// Insert }; at line 9
lines.splice(9, 0, '};');

fs.writeFileSync('public/script.js', lines.join('\n'), 'utf8');
console.log('Fixed brace');
