const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Make the product gallery sticky
s = s.replace(
    'class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;"',
    'class="product-gallery" style="display:flex; flex-direction:column; gap:1rem; position: sticky; top: 100px; height: max-content;"'
);

// Move the price block down
const priceBlockRegex = /<div style="background:#f9f9f9; padding: 1\.2rem; border-radius: 12px; margin-bottom: 1\.5rem; border: 1px solid #eee;">[\s\S]*?\/ Final ARS<\/span><\/p>\s*<\/div>/;

const priceMatch = s.match(priceBlockRegex);
if(priceMatch) {
    const priceHTML = priceMatch[0];
    
    // Remove it from current position
    s = s.replace(priceHTML, '');
    
    // Inject it right before the Add to Cart button container
    const addToCartRegex = /<div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">/;
    s = s.replace(addToCartRegex, priceHTML + '\n                                ' + '<div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">');
}

// Enhance the Title and Add to Cart button
// Title: 
s = s.replace('font-size:2.4rem; font-weight:800;', 'font-size:3rem; font-weight:700; letter-spacing: -1px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Applied sticky gallery and moved price');
