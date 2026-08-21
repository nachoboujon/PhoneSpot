const fs = require('fs');

let script = fs.readFileSync('public/script.js', 'utf8');

// 1. Rewrite the shipping logic inside renderCheckout()
const regexShipping = /const citySelect = document\.getElementById\('chk-city'\);[\s\S]*?checkoutItems\.innerHTML \+= `[\s\S]*?<\/div>\s*`;\s*\}/;

const newShipping = `const zipInput = document.getElementById('chk-zip');
    const userZip = zipInput ? zipInput.value.trim() : '';
    
    const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
    let shippingName = 'Envío';
    
    if (selectedShipping) {
        if (selectedShipping.value === 'andreani') {
            shippingCost = settings.shipping_andreani || 12000;
            shippingName = 'Envío (Andreani a Domicilio)';
        } else if (selectedShipping.value === 'andreani_sucursal') {
            shippingCost = Math.max(0, (settings.shipping_andreani || 12000) - 3000);
            shippingName = 'Envío (Andreani a Sucursal)';
        } else if (selectedShipping.value === 'correo_sucursal') {
            shippingCost = Math.max(0, (settings.shipping_correo || 8500) - 2000);
            shippingName = 'Envío (Correo a Sucursal)';
        } else {
            shippingCost = settings.shipping_correo || 8500;
            shippingName = 'Envío (Correo Argentino a Domicilio)';
        }
        
        // Envío local sin cargo
        if (userZip === '3283' || userZip === '3280') {
            shippingCost = 0;
            shippingName = 'Envío Local (Sin Cargo)';
        } else if (isFreeShipping) {
            shippingCost = 0;
            shippingName = 'Envío (Bonificado por Promoción)';
        }
        
        checkoutItems.innerHTML += \`
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #ccc; font-size: 0.9rem; color: var(--text-color);">
                <span>\${shippingName}</span>
                <span style="\${shippingCost === 0 ? 'color:#555555; font-weight:bold;' : ''}">\${shippingCost === 0 ? 'Gratis' : window.formatPrice(shippingCost)}</span>
            </div>
        \`;
    }`;

if (script.match(regexShipping)) {
    script = script.replace(regexShipping, () => newShipping);
} else {
    console.log("Could not find regexShipping");
}

// 2. Add event listeners to radio buttons and zip code so renderCheckout updates live
const addListeners = `
    // Add event listeners to update total when shipping method or zip changes
    if (window.location.pathname.includes('checkout.html')) {
        document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if(typeof renderCheckout === 'function') renderCheckout();
            });
        });
        const zipInput = document.getElementById('chk-zip');
        if (zipInput) {
            zipInput.addEventListener('input', () => {
                if (zipInput.value.trim() === '3280' || zipInput.value.trim() === '3283') {
                    if(typeof renderCheckout === 'function') renderCheckout();
                }
            });
            zipInput.addEventListener('blur', () => {
                if(typeof renderCheckout === 'function') renderCheckout();
            });
        }
    }
`;
script = script.replace(/renderCheckout\(\);\s*\}\s*\}\);/, (match) => match + '\n' + addListeners);


// 3. Fix the checkout submit logic to match!
const submitShippingRegex = /if \(city === 'Otra'\) \{[\s\S]*?if \(isFreeShipping\) \{\s*shipping_cost = 0;\s*\}\s*\}\s*\} else \{\s*shipping_cost = 0;\s*\}/;

const newSubmitShipping = `
            const zipVal = document.getElementById('chk-zip').value.trim();
            const selShip = document.querySelector('input[name="shipping_method"]:checked');
            if (selShip) {
                if (selShip.value === 'andreani') shipping_cost = settings.shipping_andreani || 12000;
                else if (selShip.value === 'andreani_sucursal') shipping_cost = Math.max(0, (settings.shipping_andreani || 12000) - 3000);
                else if (selShip.value === 'correo_sucursal') shipping_cost = Math.max(0, (settings.shipping_correo || 8500) - 2000);
                else shipping_cost = settings.shipping_correo || 8500;
            }
            if (zipVal === '3280' || zipVal === '3283') shipping_cost = 0;
            if (isFreeShipping) shipping_cost = 0;
`;

if (script.match(submitShippingRegex)) {
    script = script.replace(submitShippingRegex, () => newSubmitShipping);
}

fs.writeFileSync('public/script.js', script, 'utf8');
