const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexPrice = /<div style="background:#f9f9f9; padding: 1\.2rem; border-radius: 12px; margin-bottom: 1\.5rem; border: 1px solid #eee;">\s*\$\{oldPrice\}\s*<p class="price".*?>\$\{window\.formatPrice\(Number\(prod\.price\)\)\}.*?<\/p>\s*<\/div>/;

s = s.replace(regexPrice, (match) => {
    return match + `
                                <div style="margin-bottom:1.5rem;">
                                    \${!hasVariants ? \`<p style="font-size:0.95rem; font-weight:bold; color: \${prod.stock > 0 ? '#2ecc71' : '#ff4757'};"><i class="fa-solid \${prod.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> \${prod.stock > 0 ? 'Stock disponible: ' + prod.stock + ' unidades' : 'Sin stock'}</p>\` : ''}
                                </div>`;
});

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added stock info to product page');
