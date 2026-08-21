const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBtnClick = /const priceStr = card\.querySelector\('\.price'\)\.innerText\.replace\('\$', ''\)\.split\(' '\)\.pop\(\);\s*const price = parseFloat\(priceStr\);/;

if (s.match(regexBtnClick)) {
    s = s.replace(regexBtnClick, `const price = parseFloat(card.dataset.price);`);
    console.log('Replaced price parse logic in btn listener');
} else {
    console.log('Did not find regexBtnClick');
}

// Ensure all product cards have data-price set to prod.price
s = s.replace(/<div class="product-card \$\{prod\.is_offer \? 'offer-card' : ''\}" data-id="\$\{prod\.id\}">/g, 
              `<div class="product-card \${prod.is_offer ? 'offer-card' : ''}" data-id="\${prod.id}" data-price="\${prod.price}">`);

s = s.replace(/<div class="product-details" data-id="\$\{prod\.id\}"/g, 
              `<div class="product-details" data-id="\${prod.id}" data-price="\${prod.price}"`);

s = s.replace(/<div class="hero-content" data-id="\$\{prod\.id\}"/g,
              `<div class="hero-content" data-id="\${prod.id}" data-price="\${prod.price}"`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Done');
