const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const replacement = `
    let finalDisplayTotal = total;
    let finalShipping = shippingCost;
    
    if (window.currentCoupon) {
        if (window.currentCoupon.type === 'percent') {
            const discount = finalDisplayTotal * (window.currentCoupon.value / 100);
            finalDisplayTotal -= discount;
            checkoutItems.innerHTML += \`
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Descuento (\${window.currentCoupon.value}%)</span>
                    <span>-\${window.formatPrice(discount)}</span>
                </div>\`;
        } else if (window.currentCoupon.type === 'fixed') {
            finalDisplayTotal -= window.currentCoupon.value;
            checkoutItems.innerHTML += \`
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Descuento Fijo</span>
                    <span>-\${window.formatPrice(window.currentCoupon.value)}</span>
                </div>\`;
        } else if (window.currentCoupon.type === 'shipping') {
            finalShipping = 0;
            checkoutItems.innerHTML += \`
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Envío Bonificado (Cupón)</span>
                    <span>Gratis</span>
                </div>\`;
        }
    }
    
    checkoutTotal.innerText = \`\${window.formatPrice(finalDisplayTotal + finalShipping)}\`;
`;

s = s.replace(/checkoutTotal\.innerText = `\$\{window\.formatPrice\(total \+ shippingCost\)\}`;/, replacement);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Modified renderCheckout for coupons');
