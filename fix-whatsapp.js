const fs = require('fs');

const files = ['public/index.html', 'public/catalogo.html', 'public/producto.html', 'public/checkout.html'];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Regex to match the hardcoded whatsapp button
        content = content.replace(/<a href="https:\/\/wa\.me[^>]+class="whatsapp-float"[^>]*>[\s\S]*?<\/a>/g, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Removed hardcoded WA from ' + file);
    }
}

// Now script.js
let s = fs.readFileSync('public/script.js', 'utf8');

// Remove the block at line 574
const regexInjection1 = /\/\/ Inyectar Botón Flotante de WhatsApp Global\s*if \(\!document\.getElementById\('wa-float-btn'\)\) \{[\s\S]*?waBtn\.innerHTML = '<i class="fa-brands fa-whatsapp"><\/i>';\s*document\.body\.appendChild\(waBtn\);\s*\}/;
s = s.replace(regexInjection1, '');

// Remove the block at line 2713
const regexInjection2 = /const waPhone = window\.phoneSpotSettings\?\.whatsapp_number \|\| '5493447416011';\s*const waBtn = document\.createElement\('a'\);\s*waBtn\.href = `https:\/\/wa\.me\/\$\{waPhone\}\?text=\$\{encodeURIComponent\('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta\.'\)\}`; \s*waBtn\.target = '_blank';\s*waBtn\.className = 'float-wa fade-up visible';\s*waBtn\.innerHTML = '<i class="fa-brands fa-whatsapp"><\/i>';\s*document\.body\.appendChild\(waBtn\);/;
s = s.replace(regexInjection2, '');

// Wait, I will just brute-force replace them because Regex might fail due to whitespace.
s = s.replace(/\/\/ Inyectar Botón Flotante de WhatsApp Global[\s\S]*?document\.body\.appendChild\(waBtn\);\s*\}/g, '');

const regexInj2 = /const waPhone = window\.phoneSpotSettings\?\.whatsapp_number[\s\S]*?document\.body\.appendChild\(waBtn\);/g;
s = s.replace(regexInj2, '');

// And then I will add ONE clean injection at the end of loadProductsFromDB or applyFrontendSettings.
// The best place is inside applyFrontendSettings.
const regexApplySettings = /window\.applyFrontendSettings = async \(\) => \{/;
const cleanWaInjection = `window.applyFrontendSettings = async () => {
    // Inyectar WhatsApp
    if (!document.getElementById('wa-float-btn')) {
        const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
        const waBtn = document.createElement('a');
        waBtn.id = 'wa-float-btn';
        waBtn.href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
        waBtn.className = 'whatsapp-float';
        waBtn.target = '_blank';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        document.body.appendChild(waBtn);
    } else {
        const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
        document.getElementById('wa-float-btn').href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
    }`;

s = s.replace(regexApplySettings, cleanWaInjection);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Cleaned up duplicate WhatsApp buttons and unified into one dynamic injector!');
