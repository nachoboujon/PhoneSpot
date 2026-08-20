const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Replace top-level JSON.parse for cart
s = s.replace(/let cart = JSON\.parse\(localStorage\.getItem\('phoneSpotCart'\)\) \|\| \[\];/g, `let cart = [];
try {
    const rawCart = localStorage.getItem('phoneSpotCart');
    if (rawCart) cart = JSON.parse(rawCart) || [];
} catch(e) {
    console.error('Cart parse error, resetting', e);
    localStorage.removeItem('phoneSpotCart');
}`);

// Do the same for favorites if needed, though they usually use (localStorage.getItem('phoneSpotFavs') || '[]')
s = s.replace(/JSON\.parse\(localStorage\.getItem\('([^']+)'\) \|\| '\[\]'\)/g, `(function(){ try { return JSON.parse(localStorage.getItem('$1') || '[]'); } catch(e) { return []; } })()`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Wrapped JSON.parse in try-catch to prevent fatal crashes.');
