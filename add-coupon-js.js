const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const applyCouponFunc = `
window.currentCoupon = null;
window.applyCoupon = () => {
    const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    
    if (!code) {
        window.currentCoupon = null;
        if(msg) { msg.innerText = ''; }
        renderCheckout();
        return;
    }
    
    // Hardcoded demo coupons or you can fetch from settings
    const settings = window.phoneSpotSettings || {};
    const coupons = settings.coupons || [
        { code: 'NACHO15', type: 'percent', value: 15 },
        { code: 'ENVIOFREE', type: 'shipping', value: 0 },
        { code: 'DESCUENTO50', type: 'fixed', value: 50 }
    ];
    
    const found = coupons.find(c => c.code === code);
    if (found) {
        window.currentCoupon = found;
        msg.style.color = '#2ecc71';
        msg.innerText = '¡Cupón aplicado exitosamente!';
    } else {
        window.currentCoupon = null;
        msg.style.color = '#e74c3c';
        msg.innerText = 'Cupón inválido o expirado.';
    }
    renderCheckout();
};
`;

s += '\n\n' + applyCouponFunc;
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added applyCoupon');
