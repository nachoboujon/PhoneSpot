const fs = require('fs');

let script = fs.readFileSync('public/script.js', 'utf8');

// Update applyFrontendSettings rendering
const applyRegex = /costAndreaniEl\.dataset\.cost = data\.shipping_andreani \|\| 12000;\s*\}/;
const newApply = `costAndreaniEl.dataset.cost = data.shipping_andreani || 12000;
        }
        
        const costCorreoSucursalEl = document.getElementById('cost-correo-sucursal');
        const costAndreaniSucursalEl = document.getElementById('cost-andreani-sucursal');
        if (costCorreoSucursalEl) {
            const cost = Math.max(0, (data.shipping_correo || 8500) - 2000);
            costCorreoSucursalEl.innerText = '$' + cost.toLocaleString('es-AR');
            costCorreoSucursalEl.dataset.cost = cost;
        }
        if (costAndreaniSucursalEl) {
            const cost = Math.max(0, (data.shipping_andreani || 12000) - 3000);
            costAndreaniSucursalEl.innerText = '$' + cost.toLocaleString('es-AR');
            costAndreaniSucursalEl.dataset.cost = cost;
        }`;
script = script.replace(applyRegex, () => newApply); // Using a function avoids the $$ regex bug!


// Update checkout form submission
const submitRegex = /shipping_cost = selShip\.value === 'andreani'\s*\?\s*\(settings\.shipping_andreani \|\| 12000\)\s*:\s*\(settings\.shipping_correo \|\| 8500\);/;
const newSubmit = `
                    if (selShip.value === 'andreani') shipping_cost = settings.shipping_andreani || 12000;
                    else if (selShip.value === 'andreani_sucursal') shipping_cost = Math.max(0, (settings.shipping_andreani || 12000) - 3000);
                    else if (selShip.value === 'correo_sucursal') shipping_cost = Math.max(0, (settings.shipping_correo || 8500) - 2000);
                    else shipping_cost = settings.shipping_correo || 8500;
`;
script = script.replace(submitRegex, newSubmit);

fs.writeFileSync('public/script.js', script, 'utf8');
