const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexCheckout = /function renderCheckout\(\) \{[\s\S]*?checkoutItems\.innerHTML \+= `[\s\S]*?`;\n    \}\);/;

const replacementCheckout = `function renderCheckout() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutTotal) return;

    let total = 0;
    checkoutItems.innerHTML = '';
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;
    
    if (isWholesale) {
        checkoutItems.innerHTML += \`<div style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 15px;">
                        <i class="fa-solid fa-tags"></i> Precio Mayorista Aplicado
                      </div>\`;
    }
    
    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice -= wholesaleDiscount;
        total += finalPrice * item.quantity;
        
        checkoutItems.innerHTML += \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; font-size: 0.9rem; color: var(--text-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <div style="display:flex; flex-direction:column;">
                    <strong>\${item.quantity}x \${item.name}</strong>
                    \${item.variant_name ? \`<span style="color:var(--text-muted); font-size:0.8rem;">\${item.variant_name}</span>\` : ''}
                </div>
                <div style="text-align: right;">
                    \${isWholesale ? \`<span style="color: #ff4757; text-decoration:line-through; font-size: 0.8rem; display:block;">$\${(item.price * item.quantity).toLocaleString('es-AR')}</span>\` : ''}
                    <strong>$\${(finalPrice * item.quantity).toLocaleString('es-AR')}</strong>
                </div>
            </div>
        \`;
    });`;

if(s.match(regexCheckout)) {
    s = s.replace(regexCheckout, replacementCheckout);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Wholesale logic added to checkout');
} else {
    console.log('Could not match regexCheckout');
}
