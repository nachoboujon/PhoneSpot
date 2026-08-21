const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBtnAdd = /<input type="text" class="var-ram" placeholder="RAM \(Opc\. Ej: 8GB\)" style="flex:1; min-width:120px;">\s*<input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">/;

const replacementBtnAdd = `<input type="text" class="var-ram" placeholder="RAM (Opc. Ej: 8GB)" style="flex:1; min-width:100px;">
                    <input type="number" class="var-price" placeholder="Precio" min="0" style="width:110px;" title="Deja vacío para precio base">
                    <input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">`;

if (s.match(regexBtnAdd)) {
    s = s.replace(regexBtnAdd, replacementBtnAdd);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Added var-price to dynamic JS row');
} else {
    console.log('Could not match dynamic JS row');
}
