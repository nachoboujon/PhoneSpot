const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldSubmit = /const orderTotal = total;[\s\S]*?body: JSON\.stringify\(\{ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost: \(window\.currentCoupon && window\.currentCoupon\.type === 'shipping'\) \? 0 : shippingCost, discount_code: window\.currentCoupon \? window\.currentCoupon\.code : null, discount_amount: \(window\.currentCoupon && window\.currentCoupon\.type === 'fixed'\) \? window\.currentCoupon\.value : \(\(window\.currentCoupon && window\.currentCoupon\.type === 'percent'\) \? \(total \* \(window\.currentCoupon\.value \/ 100\)\) : 0\), dolar_value: window\.dolarValue \}\)/;

const newSubmit = `const orderTotal = total;
                const finalShippingCost = (window.currentCoupon && window.currentCoupon.type === 'shipping') ? 0 : shipping_cost;
                const finalTotalArs = Math.round(orderTotal * window.dolarValue) + finalShippingCost;
                
                showToast('Procesando orden...', 'fa-spinner fa-spin');

                const response = await fetch(window.API_URL + '/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost: finalShippingCost, discount_code: window.currentCoupon ? window.currentCoupon.code : null, discount_amount: (window.currentCoupon && window.currentCoupon.type === 'fixed') ? window.currentCoupon.value : ((window.currentCoupon && window.currentCoupon.type === 'percent') ? (total * (window.currentCoupon.value / 100)) : 0), dolar_value: window.dolarValue })`;

s = s.replace(oldSubmit, newSubmit);

// Fix WhatsApp message total
const oldWpMsg = /\*Total a pagar:\* \$\{window\.formatPrice\(orderTotal\)\}/;
s = s.replace(oldWpMsg, '*Total a pagar:* $' + '${finalTotalArs.toLocaleString(\'es-AR\')}');

// Fix MP total
const oldMpTotal = /total_ars: Math\.round\(orderTotal \* window\.dolarValue\)/;
s = s.replace(oldMpTotal, 'total_ars: finalTotalArs');

// Fix city === 'Otra' logic in checkout submit which I missed earlier
const oldSubmitCity = /if \(city === 'Otra'\) \{([\s\S]*?)if \(isFreeShipping\) \{/g;
const newSubmitCity = `if (true) {$1if (isFreeShipping) {`;
s = s.replace(oldSubmitCity, newSubmitCity);

// Update Cache Busting
s = s.replace(/script\.js\?v=\d+/g, 'script.js?v=' + Date.now());

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed submit order totals');
