const fs = require('fs');

let admin = fs.readFileSync('public/admin.html', 'utf8');

// Remove the inputs for shipping_andreani and shipping_correo
const regexShippingAdmin = /<div style="flex: 1; min-width: 200px;">\s*<label[\s\S]*?id="settings-shipping-andreani"[\s\S]*?<\/div>\s*<div style="flex: 1; min-width: 200px;">\s*<label[\s\S]*?id="settings-shipping-correo"[\s\S]*?<\/div>/;

admin = admin.replace(regexShippingAdmin, '');

fs.writeFileSync('public/admin.html', admin, 'utf8');
console.log('Removed manual shipping costs from admin.html');

let script = fs.readFileSync('public/script.js', 'utf8');

const progressBarLogic = `
    const settings = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    const thresholdARS = settings.free_shipping_threshold;
    const currentTotalARS = total * window.dolarValue;
    
    if (thresholdARS > 0) {
        let percent = Math.min(100, Math.round((currentTotalARS / thresholdARS) * 100));
        let remaining = thresholdARS - currentTotalARS;
        
        let message = remaining > 0 ? \`Te faltan <b style="color:var(--text-color); font-size:1rem;">\${'$' + remaining.toLocaleString('es-AR')}</b> para <b>Envío Gratis</b>\` : '<b style="color:#00a650;">¡Felicitaciones! Tienes Envío Gratis</b>';
        let color = remaining > 0 ? '#3498db' : '#00a650'; // ML style
        
        let progressBarHTML = \`
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="font-size: 0.95rem; color: var(--text-color); margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-truck-fast" style="color: \${color}; font-size:1.2rem;"></i> <span>\${message}</span>
                </div>
                <div style="width: 100%; height: 10px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="width: \${percent}%; height: 100%; background: \${color}; transition: width 0.5s ease; border-radius: 10px;"></div>
                </div>
            </div>
        \`;
        cartItemsContainer.innerHTML += progressBarHTML;
    }
`;

// Insert at the end of renderCart before updating the cartTotalElement
script = script.replace(/cartTotalElement\.innerText = `\$\{window\.formatPrice\(total\)\}`;/, (match) => {
    return progressBarLogic + '\n    ' + match;
});

// Also let's update the checkout checkout-items with the same logic!
const progressBarLogicCheckout = progressBarLogic.replace(/cartItemsContainer\.innerHTML/g, 'checkoutItems.innerHTML');
script = script.replace(/let finalDisplayTotal = total;/, (match) => {
    return progressBarLogicCheckout + '\n    ' + match;
});

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Added ML-style progress bar to script.js');
