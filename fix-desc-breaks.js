const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(
    '<p style="line-height:1.7; color: #555; font-size:0.95rem;">${prod.description}</p>',
    '<p style="line-height:1.7; color: #555; font-size:0.95rem;">${(prod.description || \'\').replace(/\\n/g, \'<br>\')}</p>'
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed description line breaks');
