const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const zipLogic = `
        const chkZip = document.getElementById('chk-zip');
        const chkCity = document.getElementById('chk-city');
        const shippingContainer = document.getElementById('shipping-options-container');
        
        if (chkZip && chkCity && shippingContainer) {
            chkZip.addEventListener('input', async (e) => {
                const zip = e.target.value.trim();
                
                // Mapa automático de CP a Ciudades locales
                const zipCityMap = {
                    '3283': 'San José',
                    '3280': 'Colón',
                    '3265': 'Villa Elisa',
                    '3260': 'Concepción del Uruguay'
                };
                
                if (zipCityMap[zip]) {
                    chkCity.value = zipCityMap[zip];
                } else if (zip.length >= 4) {
                    // Si no es local pero es un CP válido, dejamos que el usuario escriba la ciudad o la busque si se conectara una API.
                    // Podríamos limpiar la ciudad si queremos obligarlo a tipear, pero mejor dejar lo que tenga.
                }

                if (zip.length >= 4) {
                    shippingContainer.innerHTML = '<span style="color:#666;"><i class="fa-solid fa-spinner fa-spin"></i> Calculando envíos para CP ' + zip + '...</span>';
                    
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
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; background: #fff;">
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
                            shippingContainer.innerHTML = html;
                            
                            // Re-bind listeners para que el checkout renderice el nuevo total
                            document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                                radio.addEventListener('change', renderCheckout);
                            });
                            
                            // Forzar re-render de totales
                            renderCheckout();
                        }
                    } catch (err) {
                        shippingContainer.innerHTML = '<span style="color:red;">Error al calcular envíos. Intenta más tarde.</span>';
                    }
                }
            });
        }
`;

// Insert after btnNext logic
const hookPoint = "const checkoutForm = document.getElementById('checkout-form');";
if (script.includes(hookPoint)) {
    script = script.replace(hookPoint, zipLogic + '\n' + hookPoint);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Zip auto-fill logic inserted');
} else {
    console.log('Hook point not found');
}
