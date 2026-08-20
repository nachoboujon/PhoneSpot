const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const injection = `// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta; })
    .catch(e => console.error('Error fetching dolar', e));

window.formatPrice = (usdPrice) => {
    return (usdPrice * window.dolarValue).toLocaleString('es-AR');
};
// ====================================================

`;

// Just prepend it to the file!
s = injection + s;

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Injected DOLAR BLUE block at the top!');
