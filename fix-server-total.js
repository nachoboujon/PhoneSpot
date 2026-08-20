const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.replace(
    /const total = items\.reduce\(\(acc, item\) => \{\s+let finalPrice = item\.price;\s+if \(isWholesale\) finalPrice -= wholesaleDiscount;\s+return acc \+ \(finalPrice \* item\.quantity\);\s+\}, 0\) \+ extraShipping;/g,
    `const usdTotal = items.reduce((acc, item) => {
            let finalPrice = item.price;
            if (isWholesale) finalPrice -= wholesaleDiscount;
            return acc + (finalPrice * item.quantity);
        }, 0);
        const dolarValue = Number(req.body.dolar_value) || 1400;
        const total = usdTotal + (extraShipping / dolarValue);`
);

fs.writeFileSync('server.js', s, 'utf8');
console.log('Fixed server.js total calculation');
