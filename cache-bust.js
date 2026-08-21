const fs = require('fs');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
const cacheVersion = '?v=' + Date.now();

files.forEach(f => {
    let content = fs.readFileSync('public/' + f, 'utf8');
    content = content.replace(/script\.js\?v=\d+/g, 'script.js' + cacheVersion);
    fs.writeFileSync('public/' + f, content, 'utf8');
    console.log('Updated cache version in ' + f);
});
