const fs = require('fs');
const lines = fs.readFileSync('public/script.js', 'utf8').split('\n');

const newLogic = `
            const selShip = document.querySelector('input[name="shipping_method"]:checked');
            if (selShip) {
                shipping_cost = parseFloat(selShip.dataset.cost) || 0;
                const userZip = document.getElementById('chk-zip').value.trim();
                
                if (userZip === '3283' || userZip === '3280' || userZip === '3265' || userZip === '3260') {
                    shipping_cost = 0;
                } else if (isFreeShipping) {
                    shipping_cost = 0;
                }
            }
`;

// Replace lines 1698 to 1712
// 1697 is index 1696
// We want to splice from index 1697, remove 15 lines.
lines.splice(1697, 15, newLogic);
fs.writeFileSync('public/script.js', lines.join('\n'), 'utf8');
console.log('Fixed submit shipping cost perfectly');
