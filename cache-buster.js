const fs = require('fs');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
const v = Date.now();

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    s = s.replace(/<script src="script\.js[^"]*"><\/script>/g, `<script src="script.js?v=${v}"></script>`);
    fs.writeFileSync('public/' + f, s, 'utf8');
});

console.log('Cache buster applied.');
