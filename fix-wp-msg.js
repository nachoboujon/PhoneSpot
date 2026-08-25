const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const oldWpMsg = /let wpMsg = `Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo\.[\s\S]*?Quiero coordinar el pago en efectivo con ustedes \(Pesos\/Dólares\)\.`;/;

const newWpMsg = `let wpMsg = \`Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\\n\\n*Nombre:* \${customer_name}\\n*Dirección:* \${shipping_address}\\n*Total a pagar:* $\${finalTotalArs.toLocaleString('es-AR')}\\n\`;
                        if (isWholesale) wpMsg += \`*Beneficio:* Precio Mayorista Activado (-\${wholesaleDiscount} USD c/u)\\n\`;
                        wpMsg += \`\\n*Productos:*\\n\`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += \`- \${item.quantity}x \${item.name} (\${window.formatPrice(finalPrice)})\\n\`;
                        });
                        wpMsg += \`\\nQuiero coordinar el pago en efectivo con ustedes.\`;`;

if (oldWpMsg.test(script)) {
    script = script.replace(oldWpMsg, newWpMsg);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Fixed wpMsg corruption');
} else {
    console.log('Regex failed');
}
