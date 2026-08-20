const fs = require('fs');
let s = fs.readFileSync('public/checkout.html', 'utf8');

const couponHtml = `
                  <div style="margin: 1.5rem 0; display:flex; gap: 0.5rem;">
                      <input type="text" id="coupon-input" placeholder="Código de descuento" style="flex: 1; padding: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color);">
                      <button type="button" onclick="window.applyCoupon()" style="padding: 0.8rem 1.2rem; background: var(--text-color); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Aplicar</button>
                  </div>
                  <div id="coupon-msg" style="font-size: 0.85rem; margin-top: -1rem; margin-bottom: 1rem;"></div>
`;

s = s.replace('<div class="summary-total">', couponHtml + '\n                  <div class="summary-total">');
fs.writeFileSync('public/checkout.html', s, 'utf8');
console.log('Added coupon html');
