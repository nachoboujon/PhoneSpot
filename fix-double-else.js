const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const doubleElse = `    } else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += \`<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-5 USD c/u)
                      </div>\`;
    }
 else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += \`<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-\${wholesaleDiscount} USD c/u)
                      </div>\`;
    }`;

const singleElse = `    } else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += \`<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-5 USD c/u)
                      </div>\`;
    }`;

if (s.includes(doubleElse)) {
    s = s.replace(doubleElse, singleElse);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed double else syntax error');
} else {
    console.log('Could not find double else string exact match');
}
