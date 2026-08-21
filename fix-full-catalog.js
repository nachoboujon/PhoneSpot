const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexCatalogCard = /const cardHTML = `[\s\S]*?<div class="product-card" data-id="\$\{prod\.id\}" data-price="\$\{prod\.price\}" data-stock-info=".*?" style="[\s\S]*?<\/button>\s*<\/div>\s*`;/g;

// To avoid bad regex replacement, I'll search exactly for the button inside the loop.
const oldBtnRegex = /<button onclick="[\s\S]*?<\/button>/g;

let count = 0;
s = s.replace(oldBtnRegex, (match) => {
    if (match.includes("localStorage.setItem('phoneSpotCart'")) {
        count++;
        return `<button class="btn btn-block add-to-cart-btn" \${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\\'#111\\'" onmouseout="this.style.background=\\'#555555\\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> \${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>`;
    }
    return match;
});
console.log('Replaced ' + count + ' inline cart buttons');

const oldBadge = /\$\{hasOffer \? \`<span class="badge".*?<\/span>\` : ''\}/g;
let bCount = 0;
s = s.replace(oldBadge, (match) => {
    bCount++;
    return `\${prod.stock <= 0 ? \`<span class="badge" style="position:absolute; top:10px; left:10px; background:#333; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">AGOTADO</span>\` : (hasOffer ? \`<span class="badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-\${discount}%</span>\` : '')}`;
});
console.log('Replaced ' + bCount + ' badges');

fs.writeFileSync('public/script.js', s, 'utf8');
