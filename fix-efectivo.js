const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const hook = `chkCity.value = zipCityMap[zip];
                }`;
                
const efectivoLogic = `
                // Activar/Desactivar Pago en Efectivo
                const labelEfectivo = document.getElementById('label-efectivo');
                const radioEfectivo = document.querySelector('input[value="efectivo"]');
                const radioMp = document.querySelector('input[value="mercadopago"]');
                
                if (labelEfectivo && radioEfectivo && radioMp) {
                    if (zipCityMap[zip]) {
                        labelEfectivo.style.opacity = '1';
                        labelEfectivo.title = '';
                        radioEfectivo.disabled = false;
                    } else {
                        labelEfectivo.style.opacity = '0.5';
                        labelEfectivo.title = 'Solo disponible para San José, Colón, Villa Elisa y C. del Uruguay';
                        radioEfectivo.disabled = true;
                        radioMp.checked = true;
                    }
                }
`;

if (script.includes(hook)) {
    script = script.replace(hook, hook + '\n' + efectivoLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Efectivo toggle logic injected inside zip listener');
} else {
    console.log('Hook for efectivo not found');
}
