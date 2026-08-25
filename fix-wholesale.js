const fs = require('fs');

let script = fs.readFileSync('public/script.js', 'utf8');
script = script.replace(/if \(isWholesale\) finalPrice -= wholesaleDiscount;/g, 'if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);');
fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed wholesale negative price in script.js');

let server = fs.readFileSync('server.js', 'utf8');
server = server.replace(/if \(isWholesale\) finalPrice -= wholesaleDiscount;/g, 'if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);');
fs.writeFileSync('server.js', server, 'utf8');
console.log('Fixed wholesale negative price in server.js');
