const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

// Ocultamos el label de mercadopago usando display: none en lugar del flex que tiene
html = html.replace(/<label style="display:flex; align-items:flex-start; gap:1rem; cursor:pointer; padding:1\.2rem; border: 1px solid var\(--border-color\); border-radius:12px; background:#fafafa;">\s*<input type="radio" name="payment_method" value="mercadopago"/, '<label style="display:none; align-items:flex-start; gap:1rem; cursor:pointer; padding:1.2rem; border: 1px solid var(--border-color); border-radius:12px; background:#fafafa;">\n                                    <input type="radio" name="payment_method" value="mercadopago"');

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('Hidden Mercado Pago option');
