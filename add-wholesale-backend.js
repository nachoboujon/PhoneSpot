const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const target = `const extraShipping = Number(shipping_cost) || 0;
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + extraShipping;`;

const replacement = `const extraShipping = Number(shipping_cost) || 0;
        
        let totalQuantity = 0;
        items.forEach(item => totalQuantity += item.quantity);
        const isWholesale = totalQuantity >= 3;
        const wholesaleDiscount = 5;

        const total = items.reduce((acc, item) => {
            let finalPrice = item.price;
            if (isWholesale) finalPrice -= wholesaleDiscount;
            return acc + (finalPrice * item.quantity);
        }, 0) + extraShipping;`;

if (s.includes(target)) {
    s = s.replace(target, replacement);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Wholesale logic added to backend orders API');
} else {
    console.log('Target not found in server.js');
}
