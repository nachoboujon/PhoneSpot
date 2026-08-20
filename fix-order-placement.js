const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(
    /body: JSON\.stringify\(\{ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost \}\)/,
    "body: JSON.stringify({ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost, dolar_value: window.dolarValue })"
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed script.js order placement');
