const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

script = script.replace('title: "Nuevo iPhone 15 Pro"', 'title: "El vistazo al mundo Apple está aquí"');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Changed banner title');
