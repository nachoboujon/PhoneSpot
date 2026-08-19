const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexWpMsg = /const orderTotal = cart\.reduce\([\s\S]*?ustedes \(Pesos\/D[^)]*\)\.`\;/i;

const replacementWpMsg = `
                        let totalQuantity = 0;
                        cart.forEach(item => totalQuantity += item.quantity);
                        const isWholesale = totalQuantity >= 3;
                        const wholesaleDiscount = 5;

                        const orderTotal = cart.reduce((acc, item) => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            return acc + (finalPrice * item.quantity);
                        }, 0);

                        let wpMsg = \`Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\\n\\n*Nombre:* \${customer_name}\\n*Dirección:* \${shipping_address}\\n*Total a pagar:* $\${orderTotal.toLocaleString('es-AR')}\\n\`;
                        if (isWholesale) wpMsg += \`*Beneficio:* Precio Mayorista Activado (-$5 USD c/u)\\n\`;
                        wpMsg += \`\\n*Productos:*\\n\`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += \`- \${item.quantity}x \${item.name} ($\${finalPrice.toLocaleString('es-AR')})\\n\`;
                        });
                        wpMsg += \`\\nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).\`;
`;

if(s.match(regexWpMsg)) {
    s = s.replace(regexWpMsg, replacementWpMsg);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Wholesale logic added to WhatsApp message');
} else {
    console.log('Regex for WhatsApp failed');
}
