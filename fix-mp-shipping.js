const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// Replace hardcoded extra_shipping with the calculated shipping_cost
script = script.replace(/extra_shipping: 0,/g, 'extra_shipping: shipping_cost,');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed extra_shipping payload in frontend');

// Now make sure server.js handles it properly
let server = fs.readFileSync('server.js', 'utf8');
// In server.js, /api/checkout might be reading `extra_shipping` or `shipping_cost`
server = server.replace(/const extraShipping = Number\(shipping_cost\) \|\| 0;/g, 'const extraShipping = Number(req.body.extra_shipping) || Number(req.body.shipping_cost) || 0;');

fs.writeFileSync('server.js', server, 'utf8');
console.log('Fixed extra_shipping in backend');
