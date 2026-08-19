const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
s = s.replace(/\`\$\{x\*100\}% \$\{y\*100\}%\`/g, "(x*100) + '%' + ' ' + (y*100) + '%'");
fs.writeFileSync('public/script.js', s, 'utf8');
