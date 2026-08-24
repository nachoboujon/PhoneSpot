const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const oldMpItems = /const mpItems = items\.map\(item => \(\{\s*title: 'Producto PhoneSpot ' \+ \(item\.variant_name \? '\('\+item\.variant_name\+'\)' : ''\),\s*unit_price: Number\(item\.price\),\s*quantity: Number\(item\.quantity\),\s*currency_id: 'ARS'\s*\}\)\);/;

const newMpItems = `const dolarValue = Number(req.body.dolar_value) || 1400;
            const mpItems = items.map(item => ({
                title: 'Producto PhoneSpot ' + (item.variant_name ? '('+item.variant_name+')' : ''),
                unit_price: Math.round(Number(item.price) * dolarValue),
                quantity: Number(item.quantity),
                currency_id: 'ARS'
            }));`;

if (oldMpItems.test(s)) {
    s = s.replace(oldMpItems, newMpItems);
    fs.writeFileSync('server.js', s);
    console.log('Fixed unit_price conversion in MP payload');
} else {
    console.log('Regex failed');
}
