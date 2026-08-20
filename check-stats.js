const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');
let tabStats = html.substring(html.indexOf('id="tab-stats"'));
console.log(tabStats.substring(0, 1000));
