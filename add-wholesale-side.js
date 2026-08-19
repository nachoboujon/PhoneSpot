const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexSideCart = /function renderSideCart\(\) \{[\s\S]*?const fsText/i;

const replacementSideCart = `function renderSideCart() {
    const sideContainer = document.getElementById('side-cart-items');
    const sideTotal = document.getElementById('side-cart-total');
    if (!sideContainer || !sideTotal) return;

    sideContainer.innerHTML = '';
    let total = 0;
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;

    if (cart.length === 0) {
        sideContainer.innerHTML = \`
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#aaa; text-align:center;">
                <i class="fa-solid fa-cart-arrow-down" style="font-size:3rem; margin-bottom:1rem;"></i>
                <p>Tu carrito está vacío.</p>
                <button class="btn" style="margin-top:1rem;" onclick="document.getElementById('close-cart-btn').click()">Seguir comprando</button>
            </div>\`;
        sideTotal.innerText = '$0';
        const fsc = document.getElementById('free-shipping-container');
        if(fsc) fsc.style.display = 'none';
        
        // Remove wholesale banner if exists
        const oldBanner = document.getElementById('wholesale-banner-side');
        if (oldBanner) oldBanner.remove();
        
        return;
    }

    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice -= wholesaleDiscount;
        total += finalPrice * item.quantity;
        
        sideContainer.innerHTML += \`
            <div class="side-cart-item">
                <img src="\${item.img || item.image || item.image_url}" alt="\${item.name}">
                <div class="side-cart-item-info">
                    <h4>\${item.name}</h4>
                    <p>\${item.variant_name || ''}</p>
                    \${isWholesale ? \`<p style="color: #ff4757; font-size:0.8rem; text-decoration:line-through;">$\${item.price.toLocaleString('es-AR')}</p>\` : ''}
                    <p style="color: var(--text-color); font-weight:bold; margin-top:0.3rem;">$\${finalPrice.toLocaleString('es-AR')} x \${item.quantity}</p>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <div style="display:flex; align-items:center; gap:0.5rem; background:#eee; border-radius:4px; padding:0.1rem;">
                        <button onclick="changeQuantity('\${item.id}', \${item.quantity - 1})" style="border:none; background:none; cursor:pointer; width:20px;">-</button>
                        <span style="font-size:0.8rem; font-weight:bold;">\${item.quantity}</span>
                        <button onclick="changeQuantity('\${item.id}', \${item.quantity + 1})" style="border:none; background:none; cursor:pointer; width:20px;">+</button>
                    </div>
                    <span class="side-cart-remove" onclick="removeFromCart('\${item.id}')"><i class="fa-solid fa-trash"></i> Quitar</span>
                </div>
            </div>
        \`;
    });
    
    // Inject wholesale banner above total
    let bannerHtml = '';
    if (isWholesale) {
        bannerHtml = \`<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 10px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Mayorista aplicado! (-$5 USD c/u)
                      </div>\`;
    } else {
        const remaining = 3 - totalQuantity;
        bannerHtml = \`<div id="wholesale-banner-side" style="background:#fff3e0; color:#e65100; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 10px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más para activar Precio Mayorista (-$5 USD c/u)
                      </div>\`;
    }
    
    // Remove old banner to avoid duplicates
    const oldBanner = document.getElementById('wholesale-banner-side');
    if (oldBanner) oldBanner.remove();
    
    sideContainer.insertAdjacentHTML('afterend', bannerHtml);
    
    sideTotal.innerText = \`$\${total.toLocaleString('es-AR')}\`;

    const fsText`;

if(s.match(regexSideCart)) {
    s = s.replace(regexSideCart, replacementSideCart);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Wholesale logic added to Side Cart');
} else {
    console.log('Could not match regexSideCart');
}
