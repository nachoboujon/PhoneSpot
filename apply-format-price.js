const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// The helper is already inserted at the top. Let's make sure it's correct.
// We will modify window.formatPrice to not include $ if there's already one in the template string, or we just remove the $ from the template strings.
// Let's make window.formatPrice(val) return the formatted number WITHOUT the $.
// Then where there's already a $, it stays.
const regexDolarTop = /\/\/ ==================== DOLAR BLUE ====================[\s\S]*?\/\/ ====================================================/i;

const replacementDolarTop = `// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta; })
    .catch(e => console.error('Error fetching dolar', e));

window.formatPrice = (usdPrice) => {
    return (usdPrice * window.dolarValue).toLocaleString('es-AR');
};
// ====================================================`;
s = s.replace(regexDolarTop, replacementDolarTop);

// Ensure the dollar fetch is executed before the products fetch
s = s.replace(/const response = await fetch\('http:\/\/localhost:3000\/api\/products'\);/, `await window.dolarPromise;
        const response = await fetch('http://localhost:3000/api/products');`);
s = s.replace(/fetch\('http:\/\/localhost:3000\/api\/products'\)\s*\.then\(res => res\.json\(\)\)/, `window.dolarPromise.then(() => fetch('http://localhost:3000/api/products')).then(res => res.json())`);

// 1. Home page rendering
s = s.replace(/const priceFormatted = `\$[^`]+`;/, "const priceFormatted = `$${window.formatPrice(parseFloat(prod.price))}`;");

// 2. Catalog rendering
s = s.replace(/\$\{Number\(prod\.old_price\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(Number(prod.old_price))}`);
s = s.replace(/\$\{Number\(prod\.price\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(Number(prod.price))}`);
s = s.replace(/\$\{\(prod\.price \* 1\.2\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(prod.price * 1.2)}`);

// 3. Cart / Checkout logic
s = s.replace(/function renderSideCart\(\) \{/g, `async function renderSideCart() { await window.dolarPromise; `);
s = s.replace(/function renderCart\(\) \{/g, `async function renderCart() { await window.dolarPromise; `);
s = s.replace(/function renderCheckout\(\) \{/g, `async function renderCheckout() { await window.dolarPromise; `);

s = s.replace(/\$\{item\.price\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(item.price)}`);
s = s.replace(/\$\{finalPrice\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(finalPrice)}`);
s = s.replace(/\$\{\(item\.price \* item\.quantity\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(item.price * item.quantity)}`);
s = s.replace(/\$\{\(finalPrice \* item\.quantity\)\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(finalPrice * item.quantity)}`);
s = s.replace(/\$\{total\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(total)}`);

s = s.replace(/sideTotal\.innerText = `\$\$\{total\.toLocaleString\('es-AR'\)\}`;/g, 'sideTotal.innerText = `$${window.formatPrice(total)}`;');
s = s.replace(/cartTotalElement\.innerText = `\$\$\{total\.toLocaleString\('es-AR'\)\}`;/g, 'cartTotalElement.innerText = `$${window.formatPrice(total)}`;');
s = s.replace(/checkoutTotal\.innerText = `\$\$\{\(total \+ shippingCost\)\.toLocaleString\('es-AR'\)\}`;/g, 'checkoutTotal.innerText = `$${window.formatPrice(total + shippingCost)}`;');

// Missing Envío Gratis formatting
s = s.replace(/\$\{missing\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(missing)}`);
s = s.replace(/\$'\s*\+\s*shippingCost\.toLocaleString\('es-AR'\)/g, `$' + window.formatPrice(shippingCost)`);
s = s.replace(/\$'\s*\+\s*maxPriceFilter\.toLocaleString\('es-AR'\)/g, `$' + window.formatPrice(maxPriceFilter)`);

// Single product 
s = s.replace(/\$\{simulatedCost\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(simulatedCost)}`);

// WhatsApp formatting
s = s.replace(/\$\{orderTotal\.toLocaleString\('es-AR'\)\}/g, `\${window.formatPrice(orderTotal)}`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Script updated successfully with Dolar formatPrice everywhere!');
