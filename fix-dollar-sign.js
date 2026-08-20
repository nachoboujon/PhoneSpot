const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(/window\.formatPrice = \(usdPrice\) => \{\s*return \(usdPrice \* window\.dolarValue\)\.toLocaleString\('es-AR'\);\s*\};/g, `window.formatPrice = (usdPrice) => {
    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');
};`);

// Clean up any remaining double dollars or manually placed dollars
s = s.replace(/\\\$\\\$\{window\.formatPrice/g, '\\${window.formatPrice');
s = s.replace(/>\\\$\\\$\{/g, '>\\${');
s = s.replace(/`\\\$\\\$\{/g, '`\\${');
s = s.replace(/"\\\$\\\$\{/g, '"\\${');
s = s.replace(/>\\\$<span/g, '><span');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed $ formatting');
