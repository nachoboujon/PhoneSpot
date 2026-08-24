const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const validationRegex = /if \(!email \|\| !name \|\| !address\) \{[\s\S]*?return;\s*\}/;
const newValidation = `
            const city = document.getElementById('chk-city').value;
            const zip = document.getElementById('chk-zip').value;
            
            if (!email || !name || !address || !city || !zip) {
                showToast('Por favor completa todos los campos de envío.', 'fa-circle-exclamation');
                return;
            }
            
            const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
            if (!selectedShipping) {
                showToast('Por favor selecciona una opción de envío.', 'fa-truck');
                return;
            }
`;

if (validationRegex.test(script)) {
    script = script.replace(validationRegex, newValidation);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Added full validation to checkout next button');
} else {
    console.log('Validation regex failed');
}
