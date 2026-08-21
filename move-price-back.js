const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badBlockRegex = /\s*<div style="background:#f9f9f9; padding: 1\.2rem; border-radius: 12px; margin-bottom: 1\.5rem; border: 1px solid #eee;">\s*\$\{oldPrice\}\s*<p class="price" id="dynamic-price" style="font-size:2\.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">\$\{window\.formatPrice\(Number\(prod\.price\)\)\} <span style="font-size:0\.9rem; color:#888; font-weight:normal; letter-spacing:0;">\/ Final ARS<\/span><\/p>\s*<\/div>/;

const priceHTML = `<div style="background:#f9f9f9; padding: 1.2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #eee;">
                                    \${prod.is_offer ? \`<p class="old-price" style="text-decoration:line-through; color: var(--text-muted); margin-bottom:0;">\${window.formatPrice(prod.price * 1.2)}</p>\` : ''}
                                    <p class="price" id="dynamic-price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">\${window.formatPrice(Number(prod.price))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span></p>
                                </div>`;

if (s.match(badBlockRegex)) {
    // Remove from catalog
    s = s.replace(badBlockRegex, '');
    
    // Inject into single product page before add-to-cart
    const addToCartTarget = /<div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">/;
    s = s.replace(addToCartTarget, priceHTML + '\n                                <div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">');
    
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Moved price from catalog back to product page!');
} else {
    console.log('Could not match badBlockRegex in catalog!');
}
