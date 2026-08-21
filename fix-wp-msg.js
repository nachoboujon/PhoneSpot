const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badChunk = \`                        let wpMsg = \\\`Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n*Nombre:* \$\{customer_name\}\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n*Dirección:* \$\{shipping_address\}\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n*Total a pagar:* \$\{window.formatPrice(orderTotal)\}\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n\\\`;
                        if (isWholesale) wpMsg += \\\`*Beneficio:* Precio Mayorista Activado (-\$\{wholesaleDiscount\} USD c/u)\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n\\\`;
                        wpMsg += \\\`\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n*Productos:*\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n\\\`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += \\\`- \$\{item.quantity\}x \$\{item.name\} (\$\{window.formatPrice(finalPrice)\})\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}n\\\`;
                        });
                        wpMsg += \\\`\$\{window.getFullImageUrl(item.img || item.image || item.image_url)\}nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).\\\`;\`;

const goodChunk = \`                        let wpMsg = \\\`Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\\n\\n*Nombre:* \$\{customer_name\}\\n*Dirección:* \$\{shipping_address\}\\n*Total a pagar:* \$\{window.formatPrice(orderTotal)\}\\n\\\`;
                        if (isWholesale) wpMsg += \\\`*Beneficio:* Precio Mayorista Activado (-\$\{wholesaleDiscount\} USD c/u)\\n\\\`;
                        wpMsg += \\\`\\n*Productos:*\\n\\\`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += \\\`- \$\{item.quantity\}x \$\{item.name\} (\$\{window.formatPrice(finalPrice)\})\\n\\\`;
                        });
                        wpMsg += \\\`\\nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).\\\`;\`;

if (s.includes(badChunk)) {
    s = s.replace(badChunk, goodChunk);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed wpMsg');
} else {
    console.log('Not found string');
}
