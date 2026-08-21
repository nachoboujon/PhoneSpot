const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /const allProds = await res\.json\(\);/;
const replacement = `const allProds = await res.json();
        if (allProds.error) {
            console.error('Supabase Error:', allProds.error);
            showToast('Error de Base de Datos: ' + allProds.error, 'fa-times');
            return;
        }`;

s = s.replace(regex, replacement);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added better error handling to frontend');
