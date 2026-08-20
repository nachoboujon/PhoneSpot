const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(
    /\$\{window\.formatPrice\(order\.total \/ window\.dolarValue\)\}/g,
    "${window.formatPrice(order.total)}"
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed profile order format');
