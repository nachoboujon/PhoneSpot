const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /window\.checkVariantStock\(prod\);\s*\);\s*\}\);\s*\/\/\s*Inicializar estilos de botones active/;
const replacement = `window.checkVariantStock(prod);
                    
                    // Inicializar estilos de botones active`;

if (s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed straggler parenthesis');
} else {
    console.log('Could not find straggler parenthesis');
}
