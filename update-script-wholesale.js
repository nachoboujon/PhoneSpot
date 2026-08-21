const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldLogic = `const isWholesale = totalQuantity >= 3;
        const wholesaleDiscount = 5;`;
const newLogic = `let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;`;

// Replace the logic declarations
s = s.replace(/const isWholesale = totalQuantity >= 3;\s*const wholesaleDiscount = 5;/g, newLogic);

// Replace hardcoded strings
s = s.replace(/\( -\$5 USD aplicado \)/g, "( -$${wholesaleDiscount} USD aplicado )");
s = s.replace(/\(-\$5 USD c\/u\)/g, "(-$${wholesaleDiscount} USD c/u)");
s = s.replace(/Aplica descuento mayorista \(-\$5 USD por unidad\)/g, "Aplica descuento mayorista (-$${wholesaleDiscount} USD por unidad)");

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Modified script.js wholesale logic');
