const fs = require('fs');
let c = fs.readFileSync('public/checkout.html', 'utf8');
c = c.replace(/<div class="summary-line">[\s\S]*?<\/div>/, '');
fs.writeFileSync('public/checkout.html', c, 'utf8');
