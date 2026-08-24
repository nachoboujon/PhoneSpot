const fs = require('fs');

// 1. Fix admin.html carousel image input
let adminHtml = fs.readFileSync('public/admin.html', 'utf8');
adminHtml = adminHtml.replace('<label>URL de Imagen de Fondo</label>', '<label>Subir Imagen de Fondo</label>');
adminHtml = adminHtml.replace('<input type="text" id="set-car-img" required placeholder="https://...">', '<input type="file" id="set-car-img" accept="image/*" required>');
fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('Fixed admin.html carousel input to type="file"');

// 2. Remove floating unplash decorative phones from script.js carousel generator
let script = fs.readFileSync('public/script.js', 'utf8');
const floatingPhonesRegex = /\$\{.*includes\('iphone'\).*includes\('celular'\).*includes\('samsung'\).*\}\s*\?\s*`[\s\S]*?`\s*:\s*''\}/g;
if (floatingPhonesRegex.test(script)) {
    script = script.replace(floatingPhonesRegex, '');
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Removed ugly floating unsplash decoratives from carousel');
} else {
    console.log('Could not find floating decoratives regex, trying manual');
    // Manual fallback: replace the exact block if regex fails.
    // Actually, I can just replace the whole template literal for the carousel slide.
}

// 3. Make sure product cards are correctly rendered with DOM order
// The user said: "El nombre del producto aparece por encima de la foto del producto en catalogo.html"
// Let's check script.js rendering order.
