const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexRelatedPrice = /<p class="price">\$\$\{prod\.price\}<\/p>/g;
if (s.match(regexRelatedPrice)) {
    s = s.replace(regexRelatedPrice, `<p class="price">\${window.formatPrice(Number(prod.price))}</p>`);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed related products price in ARS!');
} else {
    console.log('Could not find related products price regex');
}
