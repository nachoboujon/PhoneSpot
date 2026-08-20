const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// I need to see what the exact text is at the end of renderCheckout
// Usually it is something like checkoutTotal.innerHTML = window.formatPrice(...)
