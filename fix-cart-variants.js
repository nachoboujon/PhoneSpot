const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexRemoveDef = /function removeFromCart\(id\) \{[\s\S]*?cart = cart\.filter\(item => item\.id !== id\);/;
const newRemoveDef = `function removeFromCart(id, variant_name = '') {
    cart = cart.filter(item => !(item.id === id && String(item.variant_name || '') === String(variant_name || '')));`;
s = s.replace(regexRemoveDef, newRemoveDef);

const regexChangeDef = /function changeQuantity\(id, newQuantity\) \{[\s\S]*?const item = cart\.find\(item => item\.id === id\);/;
const newChangeDef = `function changeQuantity(id, newQuantity, variant_name = '') {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id && String(item.variant_name || '') === String(variant_name || ''));`;
s = s.replace(regexChangeDef, newChangeDef);

s = s.replace(/onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity - 1\}\)"/g, `onclick="changeQuantity('\${item.id}', \${item.quantity - 1}, '\${(item.variant_name||\\'\\').replace(/'/g, \\"\\\\'\\")}')"`);
s = s.replace(/onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity \+ 1\}\)"/g, `onclick="changeQuantity('\${item.id}', \${item.quantity + 1}, '\${(item.variant_name||\\'\\').replace(/'/g, \\"\\\\'\\")}')"`);
s = s.replace(/onclick="removeFromCart\('\$\{item\.id\}'\)"/g, `onclick="removeFromCart('\${item.id}', '\${(item.variant_name||\\'\\').replace(/'/g, \\"\\\\'\\")}')"`);

s = s.replace(/onchange="changeQuantity\('\$\{item\.id\}', parseInt\(this\.value\)\)"/g, `onchange="changeQuantity('\${item.id}', parseInt(this.value), '\${(item.variant_name||\\'\\').replace(/'/g, \\"\\\\'\\")}')"`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed cart quantity and variant tracking');
