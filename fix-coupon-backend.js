const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(
    /body: JSON\.stringify\(\{ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost, dolar_value: window\.dolarValue \}\)/,
    "body: JSON.stringify({ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost: (window.currentCoupon && window.currentCoupon.type === 'shipping') ? 0 : shippingCost, discount_code: window.currentCoupon ? window.currentCoupon.code : null, discount_amount: (window.currentCoupon && window.currentCoupon.type === 'fixed') ? window.currentCoupon.value : ((window.currentCoupon && window.currentCoupon.type === 'percent') ? (total * (window.currentCoupon.value / 100)) : 0), dolar_value: window.dolarValue })"
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed script.js coupon order placement');

let s2 = fs.readFileSync('server.js', 'utf8');
s2 = s2.replace(
    /const total = usdTotal \+ \(extraShipping \/ dolarValue\);/,
    "const discountUsd = Number(req.body.discount_amount) || 0;\n        const total = usdTotal + (extraShipping / dolarValue) - discountUsd;"
);
fs.writeFileSync('server.js', s2, 'utf8');
console.log('Fixed server.js discount deduction');
