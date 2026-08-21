const fs = require('fs');

// 1. FIX PERFIL.HTML
let perfil = fs.readFileSync('public/perfil.html', 'utf8');
perfil = perfil.replace(/'http:\/\/localhost:3000\/api\/my-orders'/g, 'window.API_URL + \'/api/my-orders\'');

// Add tracking button if shipped
const oldStatusHtml = `else if (o.status === 'shipped') statusHtml = '<span style="color: #3498db; font-weight: bold;"><i class="fa-solid fa-truck-fast"></i> Enviado</span>';`;
const newStatusHtml = `else if (o.status === 'shipped') statusHtml = '<span style="color: #3498db; font-weight: bold; display:flex; flex-direction:column; align-items:flex-end; gap:5px;"><i class="fa-solid fa-truck-fast"></i> Enviado <a href="https://www.correoargentino.com.ar/formularios/e-commerce" target="_blank" style="background:#333; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; text-decoration:none;"><i class="fa-solid fa-location-crosshairs"></i> Rastrear Pedido</a></span>';`;
perfil = perfil.replace(oldStatusHtml, newStatusHtml);
fs.writeFileSync('public/perfil.html', perfil, 'utf8');
console.log('perfil.html fixed');


// 2. UPDATE CHECKOUT.HTML TO ADD BRANCH SHIPPING
let checkout = fs.readFileSync('public/checkout.html', 'utf8');
const oldShippingOpts = /<label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var\(--border-color\); border-radius:8px; cursor:pointer; background:#fff;">\s*<span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="andreani"> <i class="fa-solid fa-truck-fast"><\/i> Andreani \(A Domicilio\)<\/span>\s*<span id="cost-andreani" style="font-weight:bold; color:var\(--text-color\);">\$12\.000<\/span>\s*<\/label>/;

const newShippingOpts = `<label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var(--border-color); border-radius:8px; cursor:pointer; background:#fff;">
                                    <span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="andreani"> <i class="fa-solid fa-truck-fast"></i> Andreani (A Domicilio)</span>
                                    <span id="cost-andreani" style="font-weight:bold; color:var(--text-color);">$12.000</span>
                                </label>
                                <label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var(--border-color); border-radius:8px; cursor:pointer; background:#fff;">
                                    <span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="correo_sucursal"> <i class="fa-solid fa-store"></i> Correo Argentino (A Sucursal)</span>
                                    <span id="cost-correo-sucursal" style="font-weight:bold; color:var(--text-color);">$6.500</span>
                                </label>
                                <label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var(--border-color); border-radius:8px; cursor:pointer; background:#fff;">
                                    <span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="andreani_sucursal"> <i class="fa-solid fa-store"></i> Andreani (A Sucursal)</span>
                                    <span id="cost-andreani-sucursal" style="font-weight:bold; color:var(--text-color);">$9.000</span>
                                </label>`;

if (checkout.match(oldShippingOpts)) {
    checkout = checkout.replace(oldShippingOpts, newShippingOpts);
    fs.writeFileSync('public/checkout.html', checkout, 'utf8');
    console.log('checkout.html shipping options updated');
} else {
    console.log('Could not find shipping opts in checkout.html');
}

// 3. UPDATE SCRIPT.JS TO HANDLE NEW SHIPPING OPTIONS
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
script = script.replace(applyRegex, newApply);


// Update checkout form submission
const submitRegex = /shipping_cost = selShip\.value === 'andreani'\s*\?\s*\(settings\.shipping_andreani \|\| 12000\)\s*:\s*\(settings\.shipping_correo \|\| 8500\);/;
const newSubmit = `
                    if (selShip.value === 'andreani') shipping_cost = settings.shipping_andreani || 12000;
                    else if (selShip.value === 'andreani_sucursal') shipping_cost = Math.max(0, (settings.shipping_andreani || 12000) - 3000);
                    else if (selShip.value === 'correo_sucursal') shipping_cost = Math.max(0, (settings.shipping_correo || 8500) - 2000);
                    else shipping_cost = settings.shipping_correo || 8500;
`;
script = script.replace(submitRegex, newSubmit);

script = script.replace(/script\.js\?v=\d+/g, 'script.js?v=' + Date.now());
fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js shipping options updated');
