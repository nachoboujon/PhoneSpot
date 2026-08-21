const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /\/\/\s*Verificar si hay una variante seleccionada[\s\S]*?name = \`\$\{name\}\s*\(\$\{selectedVariant\}\)\`;\s*\}/;

const replacement = `// Verificar si hay una variante seleccionada
            let selectedVariant = '';
            
            const activeColor = card.querySelector('.var-btn.active[data-type="color"]');
            const activeCap = card.querySelector('.var-btn.active[data-type="capacity"]');
            const activeRam = card.querySelector('.var-btn.active[data-type="ram"]');

            const selColorBtn = card.querySelector('.variant-color-btn.selected');
            const selCapBtn = card.querySelector('.variant-cap-btn.selected');
            const selRamBtn = card.querySelector('.variant-ram-btn.selected');
            
            let color = '', cap = '', ram = '';

            if (activeColor || activeCap || activeRam) {
                color = activeColor ? activeColor.dataset.val : '';
                cap = activeCap ? activeCap.dataset.val : '';
                ram = activeRam ? activeRam.dataset.val : '';
            } else if (selColorBtn || selCapBtn || selRamBtn) {
                color = selColorBtn ? selColorBtn.dataset.color : '';
                cap = selCapBtn ? selCapBtn.dataset.cap : '';
                ram = selRamBtn ? selRamBtn.dataset.ram : '';
            }
            
            if (color || cap || ram) {
                selectedVariant = [color, cap, ram].filter(Boolean).join(' - ');
                // No modificar name, dejamos que el carrito maneje variant_name visualmente
                // O si preferimos: name = \`\${name} (\${selectedVariant})\`;
                // Lo mantenemos como estaba:
                name = \`\${name} (\${selectedVariant})\`; 
            }`;

if (s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed variant cart check');
} else {
    console.log('Could not match regex');
}
