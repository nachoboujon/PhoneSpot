const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexAPI = /\/\/ Obtener configuracin de la DB/i;

const replacementAPI = `
// ==================== DOLAR BLUE ====================
window.dolarValue = 1500; // Fallback
async function fetchDolar() {
    try {
        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await res.json();
        if (data && data.venta) {
            window.dolarValue = data.venta;
        }
    } catch(e) {
        console.error('Error fetching dolar blue', e);
    }
}
fetchDolar().then(() => {
    if (typeof window.triggerDolarRender === 'function') window.triggerDolarRender();
});
// ====================================================

// Obtener configuración de la DB`;

s = s.replace(/\/\/ Obtener configuraci.n de la DB/i, replacementAPI);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Dolar API integrated into script.js');
