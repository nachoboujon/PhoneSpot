const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBrokenChangeMin = /onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity - 1\}, '\$\{\(item\.variant_name \|\| \\'\\'\)\.replace\(\/\\'\/\w+, \\"\\\\\\'\\"\)\}'\)"/g;
// Actually regexing that broken string is too hard. 
// I'll just restore the whole file again, fix run-all.js so it doesn't break, and re-run.

// Actually, I can just do this:
s = s.replace(/<button onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity - 1\}[\s\S]*?width:20px;">-<\/button>/g, 
              `<button onclick="changeQuantity('\${item.id}', \${item.quantity - 1}, '\${encodeURIComponent(item.variant_name||\\'\\')}')" style="border:none; background:none; cursor:pointer; width:20px;">-</button>`);

s = s.replace(/<button onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity \+ 1\}[\s\S]*?width:20px;">\+<\/button>/g, 
              `<button onclick="changeQuantity('\${item.id}', \${item.quantity + 1}, '\${encodeURIComponent(item.variant_name||\\'\\')}')" style="border:none; background:none; cursor:pointer; width:20px;">+</button>`);

s = s.replace(/<span class="side-cart-remove" onclick="removeFromCart\('\$\{item\.id\}'[\s\S]*?<\/span>/g, 
              `<span class="side-cart-remove" onclick="removeFromCart('\${item.id}', '\${encodeURIComponent(item.variant_name||\\'\\')}')"><i class="fa-solid fa-trash"></i> Quitar</span>`);

s = s.replace(/<button onclick="removeFromCart\('\$\{item\.id\}'[\s\S]*?<\/button>/g, 
              `<button onclick="removeFromCart('\${item.id}', '\${encodeURIComponent(item.variant_name||\\'\\')}')" style="background:none; color: var(--text-muted); padding:0; width:auto; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>`);

s = s.replace(/<input type="number" value="\$\{item\.quantity\}" min="1" onchange="changeQuantity\('\$\{item\.id\}', parseInt\(this\.value\)[\s\S]*?>/g, 
              `<input type="number" value="\${item.quantity}" min="1" onchange="changeQuantity('\${item.id}', parseInt(this.value), '\${encodeURIComponent(item.variant_name||\\'\\')}')">`);

// And I must fix the functions to decode
s = s.replace(/function changeQuantity\(id, newQuantity, variant_name = ''\) \{[\s\S]*?const item = cart\.find\(item => item\.id === id && String\(item\.variant_name \|\| ''\) === String\(variant_name \|\| ''\)\);/,
`function changeQuantity(id, newQuantity, variant_name = '') {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || '')));`);

s = s.replace(/function removeFromCart\(id, variant_name = ''\) \{[\s\S]*?cart = cart\.filter\(item => !\(item\.id === id && String\(item\.variant_name \|\| ''\) === String\(variant_name \|\| ''\)\)\);/,
`function removeFromCart(id, variant_name = '') {
    cart = cart.filter(item => !(item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || ''))));`);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed syntax by using encodeURIComponent!');
