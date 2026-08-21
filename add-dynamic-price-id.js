const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexPrice = /<p class="price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">\$\{window\.formatPrice\(Number\(prod\.price\)\)\} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">\/ Final ARS<\/span><\/p>/;

if (s.match(regexPrice)) {
    s = s.replace(regexPrice, `<p class="price" id="dynamic-price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">\${window.formatPrice(Number(prod.price))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span></p>`);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Added dynamic-price ID to product price block');
} else {
    console.log('Could not match price block to add ID');
}
