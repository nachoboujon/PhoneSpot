const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexPriceUpdate = /let stockToUse = prodArg\.stock;[\s\S]*?if \(v\) \{[\s\S]*?stockToUse = parseInt\(v\.stock\);[\s\S]*?\} else \{/;

const newPriceUpdate = `let stockToUse = prodArg.stock;
                        let priceToUse = prodArg.price; // Start with base price
                        if (variants.length > 0) {
                            const v = variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                if (v.price && !isNaN(parseFloat(v.price))) priceToUse = parseFloat(v.price);
                            } else {`;

// Replace globally (it appears twice in the file according to findstr output)
s = s.replace(new RegExp(regexPriceUpdate, 'g'), newPriceUpdate);

// Now update the DOM price!
const regexDOMUpdate = /if \(stockLabel\) stockLabel\.innerHTML = \`<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"><\/i> Stock disponible: \$\{stockToUse\} unidades<\/span>\`;/;
const newDOMUpdate = `if (stockLabel) stockLabel.innerHTML = \`<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"></i> Stock disponible: \${stockToUse} unidades</span>\`;
                            const priceEl = document.getElementById('dynamic-price');
                            if (priceEl) priceEl.innerHTML = \`\${window.formatPrice(Number(priceToUse))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span>\`;`;

s = s.replace(new RegExp(regexDOMUpdate, 'g'), newDOMUpdate);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Updated checkVariantStock to handle variant prices!');
