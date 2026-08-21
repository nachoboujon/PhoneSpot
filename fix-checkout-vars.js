const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const calcOrderTotal = `
            try {
                let totalQuantity = 0;
                cart.forEach(item => totalQuantity += item.quantity);
                let wholesaleDiscount = 0;
                if (totalQuantity >= 10) wholesaleDiscount = 10;
                else if (totalQuantity >= 5) wholesaleDiscount = 7;
                else if (totalQuantity >= 3) wholesaleDiscount = 5;
                const isWholesale = wholesaleDiscount > 0;

                const total = cart.reduce((acc, item) => {
                    let finalPrice = item.price;
                    if (isWholesale) finalPrice -= wholesaleDiscount;
                    return acc + (finalPrice * item.quantity);
                }, 0);
                const orderTotal = total;
                
                showToast('Procesando orden...', 'fa-spinner fa-spin');
`;

s = s.replace(/try\s*\{\s*showToast\('Procesando orden\.\.\.', 'fa-spinner fa-spin'\);/, calcOrderTotal);

const cleanupVars = `
                    if (paymentMethod === 'efectivo') {
                        // Generar mensaje de WhatsApp
                        let wpMsg = \`Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\\n\\n*Nombre:* \${customer_name}\\n*Dirección:* \${shipping_address}\\n*Total a pagar:* \${window.formatPrice(orderTotal)}\\n\`;
                        if (isWholesale) wpMsg += \`*Beneficio:* Precio Mayorista Activado (-\${wholesaleDiscount} USD c/u)\\n\`;
                        wpMsg += \`\\n*Productos:*\\n\`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += \`- \${item.quantity}x \${item.name} (\${window.formatPrice(finalPrice)})\\n\`;
                        });
                        wpMsg += \`\\nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).\`;
                        
                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = \`https://wa.me/\${wpPhone}?text=\${encodeURIComponent(wpMsg)}\`;
                        cart = [];
                        saveCart();
                        if (typeof updateCartUI === 'function') updateCartUI();
`;

// Remove the inline orderTotal calculation that was inside `if (paymentMethod === 'efectivo')`
const regex = /if \(paymentMethod === 'efectivo'\) \{[\s\S]+?const wpPhone = window\.phoneSpotSettings\?\.whatsapp_number/g;
s = s.replace(regex, cleanupVars + '\n                        const wpPhone = window.phoneSpotSettings?.whatsapp_number');

// Fix `updateCartUI` undefined check (line 1321) by putting typeof check inside `cleanupVars`.

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed undefined variables in checkout logic');
