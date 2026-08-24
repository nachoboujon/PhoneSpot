const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const oldShippingLogic = /if \(zip\.length >= 4\) \{[\s\S]*?\}\s*\}/m;

const newShippingLogic = `if (zip.length >= 4) {
                    shippingContainer.innerHTML = \`
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; background: #fff;">
                            <input type="radio" name="shipping_method" value="coordinar" data-cost="0" data-name="Envío a Coordinar" style="accent-color: var(--text-color);" checked>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: var(--text-color);">Envío a Coordinar</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Coordinaremos el método de envío y el costo exacto por WhatsApp.</div>
                            </div>
                            <div style="font-weight: bold; color: var(--text-color);">
                                A confirmar
                            </div>
                        </label>
                    \`;
                    
                    document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                        radio.addEventListener('change', renderCheckout);
                    });
                    
                    if(typeof renderCheckout === 'function') renderCheckout();
                }`;

if (oldShippingLogic.test(script)) {
    script = script.replace(oldShippingLogic, newShippingLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Replaced complex shipping calculation with simple coordination message');
} else {
    console.log('Regex failed');
}
