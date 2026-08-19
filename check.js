const fs = require('fs');
let s = fs.readFileSync('public/index.html', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
    if (l.indexOf('href="cat') !== -1) {
        console.log((i+1) + ': ' + l.trim());
    }
});
