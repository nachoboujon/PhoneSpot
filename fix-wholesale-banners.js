const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const bannerLogicSide = `
    // Inject wholesale banner above total
    let bannerHtml = '';
    
    let nextTierQty = 3;
    let nextTierDiscount = 5;
    if (totalQuantity >= 10) { nextTierQty = 0; }
    else if (totalQuantity >= 5) { nextTierQty = 10; nextTierDiscount = 10; }
    else if (totalQuantity >= 3) { nextTierQty = 5; nextTierDiscount = 7; }

    if (totalQuantity >= 10) {
        bannerHtml = \`<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 10px;">
                        <i class="fa-solid fa-crown"></i> ¡Máximo Descuento Mayorista aplicado! (-\${wholesaleDiscount} USD c/u)
                      </div>\`;
    } else if (isWholesale) {
        const remaining = nextTierQty - totalQuantity;
        bannerHtml = \`<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 10px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Activo! (-\${wholesaleDiscount} USD c/u)<br>
                        <span style="font-size:0.75rem; color:#d35400;">(Agrega \${remaining} más para llegar a -\$\${nextTierDiscount} USD c/u)</span>
                      </div>\`;
    } else {
        const remaining = 3 - totalQuantity;
        bannerHtml = \`<div id="wholesale-banner-side" style="background:#fff3e0; color:#e65100; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 10px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más para activar Precio Mayorista (-5 USD c/u)
                      </div>\`;
    }
`;

s = s.replace(/\/\/ Inject wholesale banner above total[\s\S]+?\}\s+else\s+\{[\s\S]+?\}\s+\/\/ Remove old banner/, bannerLogicSide + '\n    // Remove old banner');

const bannerLogicMain = `
    let bannerHtml = '';
    let nextTierQty = 3;
    let nextTierDiscount = 5;
    if (totalQuantity >= 10) { nextTierQty = 0; }
    else if (totalQuantity >= 5) { nextTierQty = 10; nextTierDiscount = 10; }
    else if (totalQuantity >= 3) { nextTierQty = 5; nextTierDiscount = 7; }

    if (totalQuantity >= 10) {
        bannerHtml = \`<div id="wholesale-banner-main" style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-crown"></i> ¡Máximo Descuento Mayorista aplicado! (-\${wholesaleDiscount} USD c/u)
                      </div>\`;
    } else if (isWholesale) {
        const remaining = nextTierQty - totalQuantity;
        bannerHtml = \`<div id="wholesale-banner-main" style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:0.95rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Activo! (-\${wholesaleDiscount} USD c/u)<br>
                        <span style="font-size:0.85rem; color:#d35400;">(Agrega \${remaining} más para llegar a -\$\${nextTierDiscount} USD c/u)</span>
                      </div>\`;
    } else {
        const remaining = 3 - totalQuantity;
        bannerHtml = \`<div id="wholesale-banner-main" style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega \${remaining} equipo\${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-5 USD c/u)
                      </div>\`;
    }
`;

s = s.replace(/let bannerHtml = '';\s+if \(isWholesale\) \{[\s\S]+?\}\s+else\s+\{[\s\S]+?\}\s+\/\/ Remove old banner main/, bannerLogicMain + '\n    // Remove old banner main');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed wholesale banner logic');
