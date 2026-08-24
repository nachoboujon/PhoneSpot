const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// The block to replace:
// const mpRes = await fetch(window.API_URL + '/api/mercadopago/preference', {
//    method: 'POST',
//    headers: { 'Content-Type': 'application/json' },
//    body: JSON.stringify({ items: cart, customer_email, total_ars: finalTotalArs })
// });
// const mpData = await mpRes.json();

const oldMpFetchRegex = /const mpRes = await fetch\(window\.API_URL \+ '\/api\/mercadopago\/preference', \{[\s\S]*?body: JSON\.stringify\(\{ items: cart, customer_email, total_ars: finalTotalArs \}\)\n\s*\}\);\n\s*const mpData = await mpRes\.json\(\);/;

const newCheckoutFetch = `const token = localStorage.getItem('phonespot_token');
                            const payload = {
                                items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, variant_name: i.variant_name || null })),
                                customer_name,
                                customer_email,
                                shipping_address,
                                payment_method: 'mercadopago',
                                extra_shipping: 0,
                                discount_amount: 0,
                                dolar_value: window.dolarValue || 1400
                            };
                            
                            const mpRes = await fetch(window.API_URL + '/api/checkout', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': \`Bearer \${token}\`
                                },
                                body: JSON.stringify(payload)
                            });
                            const mpData = await mpRes.json();`;

if (oldMpFetchRegex.test(script)) {
    script = script.replace(oldMpFetchRegex, newCheckoutFetch);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('script.js updated to use /api/checkout instead of raw MP preference');
} else {
    console.log('Regex failed, attempting manual replace');
    // Manual fallback
    script = script.replace("fetch(window.API_URL + '/api/mercadopago/preference'", "fetch(window.API_URL + '/api/checkout'");
    script = script.replace("body: JSON.stringify({ items: cart, customer_email, total_ars: finalTotalArs })", "body: JSON.stringify({ items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, variant_name: i.variant_name || null })), customer_name, customer_email, shipping_address, payment_method: 'mercadopago', extra_shipping: 0, discount_amount: 0, dolar_value: window.dolarValue || 1400 })");
    // add token logic if not present
    script = script.replace("headers: { 'Content-Type': 'application/json' }", "headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('phonespot_token')}` }");
    fs.writeFileSync('public/script.js', script, 'utf8');
}
