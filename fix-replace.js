const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// The corrupted block starts at line 2399
// I will just replace the whole corrupted block and re-insert the Marquee correctly.
const regexFix = /const costCorreoSucursalEl = document\.getElementById\('cost-correo-sucursal'\);[\s\S]*?\/\/ Marquee/;

const correctBlock = `const costCorreoSucursalEl = document.getElementById('cost-correo-sucursal');
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
        }

        // Marquee`;

s = s.replace(regexFix, correctBlock.replace(/\$/g, '$$$$')); // use $$$$ to mean literal $$ in replace!
// Wait, I will just do it without replace string magic by using a function
s = s.replace(regexFix, () => correctBlock);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed string replacement bug');
