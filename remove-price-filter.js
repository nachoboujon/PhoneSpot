const fs = require('fs');
let s = fs.readFileSync('public/catalogo.html', 'utf8');

const regex = /<div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var\(--border-color\);">\s*<h3 style="font-size: 1\.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">\s*Filtrar por Precio[\s\S]*?<\/div>\s*<\/div>/g;

s = s.replace(regex, '');
fs.writeFileSync('public/catalogo.html', s, 'utf8');
console.log('Removed price filter HTML');
