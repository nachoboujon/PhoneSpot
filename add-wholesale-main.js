const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexCart = /function renderCart\(\) \{[\s\S]*?cartTotalElement\.innerText = `\$[^`]+`;\n\}/;

const replacementCart = `function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Tu carrito está vacío.</p>';
        cartTotalElement.innerText = '$0';
        return;
    }

    // Wholesale banner injection
    if (isWholesale) {
        cartItemsContainer.innerHTML += \`<div style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Mayorista activado! Estás ahorrando $5 USD por cada equipo.
                      </div>\`;
    } else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += \`<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-$5 USD c/u)
                      </div>\`;
    }

    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice -= wholesaleDiscount;
        total += finalPrice * item.quantity;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = \`
            <img src="\${item.img || item.image || item.image_url}" alt="\${item.name}">
            <div class="item-details">
                <h4>\${item.name}</h4>
                \${item.variant_name ? \`<p>\${item.variant_name}</p>\` : ''}
                \${isWholesale ? \`<p style="color: #ff4757; text-decoration:line-through; font-size: 0.8rem; margin: 0;">Precio Base: $\${(item.price * item.quantity).toLocaleString('es-AR')}</p>\` : ''}
                <div class="item-quantity" style="margin-top: 5px;">
                    <span>Cantidad:</span>
                    <input type="number" value="\${item.quantity}" min="1" onchange="changeQuantity('\${item.id}', parseInt(this.value))">
                </div>
            </div>
            <div class="item-price" style="display:flex; flex-direction:column; align-items:flex-end;">
                <strong style="font-size: 1.2rem; color: var(--text-color);">$\${(finalPrice * item.quantity).toLocaleString('es-AR')}</strong>
                \${isWholesale ? \`<span style="color:#2e7d32; font-size: 0.8rem;">( -$5 USD aplicado )</span>\` : ''}
            </div>
            <button onclick="removeFromCart('\${item.id}')" style="background:none; color: var(--text-muted); padding:0; width:auto; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        \`;
        cartItemsContainer.appendChild(itemDiv);
    });

    cartTotalElement.innerText = \`$\${total.toLocaleString('es-AR')}\`;
}`;

if(s.match(regexCart)) {
    s = s.replace(regexCart, replacementCart);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Wholesale logic added to main cart');
} else {
    console.log('Could not match regexCart');
}
