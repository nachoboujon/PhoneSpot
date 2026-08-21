const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBadge = /\$\{prod\.is_offer \? \`<div class="badge"(.*?)>OFERTA(.*?)\` : ''\}/g;
// Replace it with logic that also checks prod.stock <= 0

s = s.replace(regexBadge, (match, p1, p2) => {
    // If we find the offer badge, let's replace it with a dynamic badge that checks stock first
    return `\${prod.stock <= 0 ? \`<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#333; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">AGOTADO</div>\` : (prod.is_offer ? \`<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>\` : '')}`;
});

// Since the badge might not have the absolute positioning in some older cards, let's ensure we use a generic string replacement for the basic badge:
const basicBadge = /\$\{prod\.is_offer \? \`<div class="badge">OFERTA<\/div>\` : ''\}/g;
s = s.replace(basicBadge, `\${prod.stock <= 0 ? \`<div class="badge" style="background:#333;">SIN STOCK</div>\` : (prod.is_offer ? \`<div class="badge">OFERTA</div>\` : '')}`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added out of stock badges to catalog');
