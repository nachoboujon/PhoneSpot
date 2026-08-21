const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /\}\s*\} else \{\s*checkoutItems\.innerHTML \+= `[\s\S]*?`;\s*\}/;
s = s.replace(regex, '}');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed syntax error');
