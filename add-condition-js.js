const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /formData\.append\('description', document\.getElementById\('prod-desc'\)\.value\);/;

const replacement = `const baseDesc = document.getElementById('prod-desc').value;
            const conditionEl = document.getElementById('prod-condition');
            const condition = conditionEl ? conditionEl.value : 'Nuevo, Caja Sellada';
            
            // Si es Americano o Usado, lo agregamos a la descripción para que el buscador y el filtro lo detecten
            const finalDesc = condition !== 'Nuevo, Caja Sellada' ? \`[Condición: \${condition}] \${baseDesc}\` : baseDesc;
            formData.append('description', finalDesc);`;

if(s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Appended condition to description in script.js');
} else {
    console.log('Regex failed');
}
