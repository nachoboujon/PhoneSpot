const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. We'll set up the dolar promise at the top (it's already partially there from my previous step)
const regexDolarTop = /\/\/ ==================== DOLAR BLUE ====================[\s\S]*?\/\/ ====================================================/i;

const replacementDolarTop = `// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta; })
    .catch(e => console.error('Error fetching dolar', e));

window.formatPrice = (usdPrice) => {
    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');
};
// ====================================================`;

s = s.replace(regexDolarTop, replacementDolarTop);

// 2. Await window.dolarPromise before rendering Home products
s = s.replace(/const response = await fetch\('http:\/\/localhost:3000\/api\/products'\);/, `await window.dolarPromise;
        const response = await fetch('http://localhost:3000/api/products');`);

// 3. Update Home rendering (old_price and price)
s = s.replace(/\$<span class="amount">\$\{\(prod\.price \* 1\.2\)\.toLocaleString\('es-AR'\)\}<\/span>/g, `\${window.formatPrice(prod.price * 1.2)}`);
s = s.replace(/\$<span class="amount">\$\{prod\.price\.toLocaleString\('es-AR'\)\}<\/span>/g, `\${window.formatPrice(prod.price)}`);

// 4. Await window.dolarPromise before rendering Filtered Catalog
s = s.replace(/fetch\('http:\/\/localhost:3000\/api\/products'\)\s*\.then\(res => res\.json\(\)\)/, `window.dolarPromise.then(() => fetch('http://localhost:3000/api/products')).then(res => res.json())`);

// 5. Update Catalog rendering (old_price and price)
s = s.replace(/\$\$\{Number\(prod\.old_price\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(Number(prod.old_price))}`);
s = s.replace(/\$\$\{Number\(prod\.price\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(Number(prod.price))}`);

// 6. Update cart formatting
s = s.replace(/function renderSideCart\(\) \{/g, `async function renderSideCart() { await window.dolarPromise; `);
s = s.replace(/function renderCart\(\) \{/g, `async function renderCart() { await window.dolarPromise; `);
s = s.replace(/function renderCheckout\(\) \{/g, `async function renderCheckout() { await window.dolarPromise; `);

s = s.replace(/\\\$\\\$\{\(item\.price \* item\.quantity\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(item.price * item.quantity)}`);
s = s.replace(/\\\$\\\$\{\(finalPrice \* item\.quantity\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(finalPrice * item.quantity)}`);
s = s.replace(/\\\$\\\$\{item\.price\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(item.price)}`);
s = s.replace(/\\\$\\\$\{finalPrice\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(finalPrice)}`);
s = s.replace(/\\\$\\\$\{total\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(total)}`);

// Fix missing formatPrice replacements
s = s.replace(/sideTotal\.innerText = `\$[^`]+`/g, 'sideTotal.innerText = `${window.formatPrice(total)}`');
s = s.replace(/cartTotalElement\.innerText = `\$[^`]+`/g, 'cartTotalElement.innerText = `${window.formatPrice(total)}`');

// 7. WhatsApp message
s = s.replace(/orderTotal\.toLocaleString\('es-AR'\)/g, `(orderTotal * window.dolarValue).toLocaleString('es-AR')`);
s = s.replace(/finalPrice\.toLocaleString\('es-AR'\)/g, `(finalPrice * window.dolarValue).toLocaleString('es-AR')`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Script updated with dynamic dolar value!');
