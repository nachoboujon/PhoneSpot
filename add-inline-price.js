const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Add Price Input to the inline Add Variant form
const regexAddVariantInputs = /<input type="text" id="new-ram-\$\{p\.id\}" placeholder="RAM \(ej\. 8GB\)" style="padding:0\.2rem; width:120px;">\s*<input type="number" id="new-vstock-\$\{p\.id\}" placeholder="Stock" style="padding:0\.2rem; width:70px;">/;

const newInputs = `<input type="text" id="new-ram-\${p.id}" placeholder="RAM (ej. 8GB)" style="padding:0.2rem; width:80px;">
                                        <input type="number" id="new-vprice-\${p.id}" placeholder="Precio USD (Opc)" style="padding:0.2rem; width:110px;">
                                        <input type="number" id="new-vstock-\${p.id}" placeholder="Stock" style="padding:0.2rem; width:70px;">`;
s = s.replace(regexAddVariantInputs, newInputs);

// 2. Read the Price Input in addVariantToProduct
const regexAddVariantLogic = /const ram = document\.getElementById\(\`new-ram-\$\{id\}\`\)\.value\.trim\(\);\s*const stock = parseInt\(document\.getElementById\(\`new-vstock-\$\{id\}\`\)\.value\) \|\| 0;/;
const newLogic = `const ram = document.getElementById(\`new-ram-\${id}\`).value.trim();
                const stock = parseInt(document.getElementById(\`new-vstock-\${id}\`).value) || 0;
                const rawPrice = document.getElementById(\`new-vprice-\${id}\`).value;
                const price = rawPrice ? parseFloat(rawPrice) : null;`;
s = s.replace(regexAddVariantLogic, newLogic);

// 3. Push the price into the variants array
const regexPush = /variants\.push\(\{ color, capacity: cap, ram, stock \}\);/;
const newPush = `variants.push({ color, capacity: cap, ram, stock, price });`;
s = s.replace(regexPush, newPush);

// 4. Render the price in the existing variants list
const regexRenderList = /<span style="font-size:0\.85rem;">\$\{v\.color\} - \$\{v\.capacity\} - \$\{v\.ram\} \(Stock: \$\{v\.stock\}\)<\/span>/;
const newRenderList = `<span style="font-size:0.85rem;">\${v.color} - \${v.capacity} - \${v.ram} (Stock: \${v.stock})\${v.price ? ' - <strong style="color:#0071e3">US$ ' + v.price + '</strong>' : ''}</span>`;
// I changed $ to US$ so it avoids the regex replacement bug.
s = s.replace(regexRenderList, newRenderList);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Updated inline variant editor to support prices!');
