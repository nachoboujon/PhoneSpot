const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexRemoveDef = /function removeFromCart\(id\) \{[\s\S]*?cart = cart\.filter\(item => item\.id !== id\);/;
const newRemoveDef = `function removeFromCart(id, variant_name = '') {
    cart = cart.filter(item => !(item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || ''))));`;
s = s.replace(regexRemoveDef, newRemoveDef);

const regexChangeDef = /function changeQuantity\(id, newQuantity\) \{[\s\S]*?const item = cart\.find\(item => item\.id === id\);/;
const newChangeDef = `function changeQuantity(id, newQuantity, variant_name = '') {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || '')));`;
s = s.replace(regexChangeDef, newChangeDef);

s = s.replace(/changeQuantity\('\$\{item\.id\}', \$\{item\.quantity - 1\}\)/g, 
              `changeQuantity('\${item.id}', \${item.quantity - 1}, '\${encodeURIComponent(item.variant_name || String())}')`);

s = s.replace(/changeQuantity\('\$\{item\.id\}', \$\{item\.quantity \+ 1\}\)/g, 
              `changeQuantity('\${item.id}', \${item.quantity + 1}, '\${encodeURIComponent(item.variant_name || String())}')`);

s = s.replace(/removeFromCart\('\$\{item\.id\}'\)/g, 
              `removeFromCart('\${item.id}', '\${encodeURIComponent(item.variant_name || String())}')`);

s = s.replace(/changeQuantity\('\$\{item\.id\}', parseInt\(this\.value\)\)/g, 
              `changeQuantity('\${item.id}', parseInt(this.value), '\${encodeURIComponent(item.variant_name || String())}')`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Applied cart variants clean WITHOUT QUOTES');
