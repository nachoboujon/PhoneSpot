const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const apiUrlConfig = `
// ==================== CONFIGURACIÓN DE API ====================
// Cambia 'http://localhost:3000' por la URL de tu servidor en producción (ej. 'https://tu-backend.onrender.com')
window.API_URL = 'http://localhost:3000';
// ==============================================================
`;

if (!s.includes('window.API_URL =')) {
    s = s.replace('// ==================== DOLAR BLUE ====================', apiUrlConfig + '\n// ==================== DOLAR BLUE ====================');
    
    // Replace all occurrences of 'http://localhost:3000
    s = s.replace(/'http:\/\/localhost:3000/g, 'window.API_URL + \'');
    s = s.replace(/`http:\/\/localhost:3000/g, '`${window.API_URL}');
    
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Injected window.API_URL configuration');
}
