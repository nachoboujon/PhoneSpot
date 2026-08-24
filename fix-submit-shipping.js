const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const regex = /if \(city === 'Otra'\) \{[\s\S]*?\}\s*\}/m;

const newLogic = `
            const selShip = document.querySelector('input[name="shipping_method"]:checked');
            if (selShip) {
                shipping_cost = parseFloat(selShip.dataset.cost) || 0;
                const userZip = document.getElementById('chk-zip').value.trim();
                
                // Enforce Free Shipping overrides just like in renderCheckout
                if (userZip === '3283' || userZip === '3280' || userZip === '3265' || userZip === '3260') {
                    shipping_cost = 0;
                } else if (isFreeShipping) {
                    shipping_cost = 0;
                }
            }
`;

if (regex.test(script)) {
    script = script.replace(regex, newLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Fixed submit shipping cost logic');
} else {
    console.log('Regex failed');
}
