const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<input type="text" class="var-ram" placeholder="RAM \(Opc\. Ej: 8GB\)" style="flex:1; min-width:120px;">\s*<input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">/;

const replacement = `<input type="text" class="var-ram" placeholder="RAM (Opc. Ej: 8GB)" style="flex:1; min-width:100px;">
                                    <input type="number" class="var-price" placeholder="Precio (Opcional)" min="0" style="width:110px;" title="Deja vacío para usar el precio base del producto">
                                    <input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">`;

if (s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/admin.html', s, 'utf8');
    console.log('Added price to admin.html modal!');
} else {
    console.log('Failed to match admin.html modal');
}
