const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const newLogic = `
        let totalQuantity = 0;
        items.forEach(item => totalQuantity += item.quantity);
        let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;
`;

s = s.replace(/let totalQuantity = 0;\s+items\.forEach\(item => totalQuantity \+= item\.quantity\);\s+const isWholesale = totalQuantity >= 3;\s+const wholesaleDiscount = 5;/, newLogic);
fs.writeFileSync('server.js', s, 'utf8');
console.log('Fixed wholesale server logic');
