const fs = require('fs');

let html = fs.readFileSync('public/checkout.html', 'utf8');

const regexZip = /<input type="text" id="chk-zip" placeholder="Código Postal" required>/;
const newZip = `<div style="display: flex; gap: 10px;">
                                <input type="text" id="chk-zip" placeholder="Código Postal" required style="flex: 1;">
                                <button type="button" id="btn-cotizar" style="background: var(--text-color); color: var(--bg-color); border: none; border-radius: 8px; padding: 0 15px; cursor: pointer; font-weight: bold;">Cotizar</button>
                            </div>`;
                            
html = html.replace(regexZip, newZip);

const regexShippingMethods = /<div style="display: flex; flex-direction: column; gap: 0\.5rem;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- Resumen -->/;
// Actually just replace the shipping options div with a container.
// Wait, regex might fail. Let's find exactly the container.
// `<div style="display: flex; flex-direction: column; gap: 0.5rem;">` is after `<h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-truck"></i> Método de Envío</h3>`

html = html.replace(/<div style="display: flex; flex-direction: column; gap: 0\.5rem;">[\s\S]*?<\/div>/, '<div id="shipping-options-container" style="display: flex; flex-direction: column; gap: 0.5rem; color: #888; font-style: italic;">Ingresa tu código postal y haz clic en Cotizar para ver las opciones.</div>');

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('Updated checkout.html for dynamic shipping');

// Now update script.js
let script = fs.readFileSync('public/script.js', 'utf8');

// I will append the logic for the Cotizar button
const cotizarLogic = `
// ==================== DYNAMIC SHIPPING QUOTES ====================
if (window.location.pathname.includes('checkout.html')) {
    const btnCotizar = document.getElementById('btn-cotizar');
    const zipInput = document.getElementById('chk-zip');
    const container = document.getElementById('shipping-options-container');
    
    if (btnCotizar && zipInput && container) {
        btnCotizar.addEventListener('click', async () => {
            const zip = zipInput.value.trim();
            if (!zip) return showToast('Ingresa tu código postal primero', 'fa-triangle-exclamation');
            
            btnCotizar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            container.innerHTML = '<div style="color:#555;">Calculando mejores tarifas con Zipnova...</div>';
            
            try {
                const res = await fetch(window.API_URL + '/api/shipping/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ zip_code: zip, items: cart })
                });
                const data = await res.json();
                
                if (data.success && data.options) {
                    let html = '';
                    data.options.forEach((opt, idx) => {
                        html += \`
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px;">
                                <input type="radio" name="shipping_method" value="\${opt.id}" data-cost="\${opt.cost}" data-name="\${opt.name}" style="accent-color: var(--text-color);" \${idx === 0 ? 'checked' : ''}>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: var(--text-color);">\${opt.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Tiempo estimado: \${opt.time}</div>
                                </div>
                                <div style="font-weight: bold; color: var(--text-color);">
                                    \${opt.cost === 0 ? 'Gratis' : window.formatPrice(opt.cost)}
                                </div>
                            </label>
                        \`;
                    });
                    container.innerHTML = html;
                    
                    // Attach event listeners to new radios
                    document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                        radio.addEventListener('change', () => {
                            if(typeof renderCheckout === 'function') renderCheckout();
                        });
                    });
                    
                    // Re-render checkout to update total
                    if(typeof renderCheckout === 'function') renderCheckout();
                    
                } else {
                    container.innerHTML = '<div style="color:red;">Error al cotizar. Intenta nuevamente.</div>';
                }
            } catch (e) {
                container.innerHTML = '<div style="color:red;">Error de conexión.</div>';
            }
            btnCotizar.innerHTML = 'Cotizar';
        });
    }
}
`;

if (!script.includes('btnCotizar.addEventListener')) {
    script += cotizarLogic;
    
    // Also, update renderCheckout and checkoutForm submit to use data-cost instead of hardcoded values!
    // renderCheckout:
    script = script.replace(/if \(selectedShipping\) \{[\s\S]*?\/\/ Envío local sin cargo/m, `if (selectedShipping) {
        shippingCost = parseFloat(selectedShipping.dataset.cost) || 0;
        shippingName = selectedShipping.dataset.name || 'Envío';
        
        // Envío local sin cargo`);
        
    // Submit:
    script = script.replace(/const selShip = document\.querySelector\('input\[name="shipping_method"\]:checked'\);\s*if \(selShip\) \{[\s\S]*?else shipping_cost = settings\.shipping_correo \|\| 8500;\s*\}/m, `const selShip = document.querySelector('input[name="shipping_method"]:checked');
            if (selShip) {
                shipping_cost = parseFloat(selShip.dataset.cost) || 0;
            }`);
    
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Updated script.js with Zipnova cotizar logic');
}

