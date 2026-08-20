const fs = require('fs');

let orig = fs.readFileSync('original_script.js', 'utf16le');
let cur = fs.readFileSync('public/script.js', 'utf8');

// We have lines like: document.getElementById('')..display = 'block';
// And in orig: document.getElementById('free-shipping-container').style.display = 'block';

// We want to replace all corrupted patterns in `cur` with their original matches.
// We can find all getElementById and querySelector calls in orig:
const regex = /document\.(getElementById|querySelector)\('[^']+'\)\.[a-zA-Z0-9_]+/g;
const origMatches = [...orig.matchAll(regex)].map(m => m[0]);

// For each corrupted line in cur, we can find the matching original.
// Wait, in cur it looks like: document.getElementById('')..display
// But wait, the `.style` was stripped! So it's `..display`.
// Wait, my corruption regex replaced `?.` with `.`. So `document.getElementById('')?.style.display` became `document.getElementById('')..style.display`? No, it became `document.getElementById('')..display`?
// Let's just find `document.getElementById('').` and `document.querySelector('').` in `cur`.
// Actually, `cur` has: `document.getElementById('')..` or `document.getElementById('').(` or `document.getElementById('').=`
// This is too hard to parse.

// Let's just take the original file, and RE-APPLY our 5 features. It's much safer and guarantees zero corruption.

let finalCode = orig;

// 1. Dolar Blue at top
const injection = `window.phoneSpotSettings = window.phoneSpotSettings || {};
// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta; })
    .catch(e => console.error('Error fetching dolar', e));

window.formatPrice = (usdPrice) => {
    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');
};
// ====================================================

`;
finalCode = injection + finalCode;

// 2. Try Catch cart
finalCode = finalCode.replace(/let cart = JSON\.parse\(localStorage\.getItem\('phoneSpotCart'\)\) \|\| \[\];/g, `let cart = [];
try {
    const rawCart = localStorage.getItem('phoneSpotCart');
    if (rawCart) cart = JSON.parse(rawCart) || [];
} catch(e) {
    console.error('Cart parse error, resetting', e);
    localStorage.removeItem('phoneSpotCart');
}`);
finalCode = finalCode.replace(/JSON\.parse\(localStorage\.getItem\('([^']+)'\) \|\| '\[\]'\)/g, `(function(){ try { return JSON.parse(localStorage.getItem('$1') || '[]'); } catch(e) { return []; } })()`);

// 3. Wholesale cart logic (-$5)
finalCode = finalCode.replace(/const total = cart\.reduce\(\(sum, item\) => sum \+ \(item\.price \* item\.quantity\), 0\);/g, 
\`const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        const isWholesale = totalQuantity >= 3;
        const total = cart.reduce((sum, item) => {
            let itemPrice = item.price;
            if (isWholesale) itemPrice = Math.max(0, itemPrice - 5);
            return sum + (itemPrice * item.quantity);
        }, 0);\`);

finalCode = finalCode.replace(/item\.price/g, '(isWholesale ? Math.max(0, item.price - 5) : item.price)');

// Wait, I shouldn't just replace `item.price` everywhere.
// Let's fix this properly inside renderCart, renderSideCart, renderCheckout.
