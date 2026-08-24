const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

script = script.replace(/if \(userZip === '3283' \|\| userZip === '3280'\)/g, "if (userZip === '3283' || userZip === '3280' || userZip === '3265' || userZip === '3260')");

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed local zip codes in renderCheckout');

let server = fs.readFileSync('server.js', 'utf8');
server = server.replace(/let isLocal = \(zip_code === '3280' \|\| zip_code === '3283'\);/g, "let isLocal = (zip_code === '3280' || zip_code === '3283' || zip_code === '3265' || zip_code === '3260');");
fs.writeFileSync('server.js', server, 'utf8');
console.log('Fixed local zip codes in server.js');
