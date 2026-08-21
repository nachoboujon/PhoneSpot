const fs = require('fs');

// 1. Remove hardcoded from HTML
const files = ['public/index.html', 'public/catalogo.html', 'public/producto.html', 'public/checkout.html'];
for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/<a href="https:\/\/wa\.me[^>]+class="whatsapp-float"[^>]*>[\s\S]*?<\/a>/g, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Removed hardcoded WA from ' + file);
    }
}

let s = fs.readFileSync('public/script.js', 'utf8');

// 2. Remove line 574 duplicate
const regex1 = /\/\/ Inyectar Botón Flotante de WhatsApp Global[\s\S]*?document\.body\.appendChild\(waBtn\);\s*\}/g;
s = s.replace(regex1, '');

// 3. Remove line 2713 duplicate
const regex2 = /const waPhone = window\.phoneSpotSettings\?\.whatsapp_number[^;]*;[\s\S]*?waBtn\.innerHTML = '<i class="fa-brands fa-whatsapp"><\/i>';\s*document\.body\.appendChild\(waBtn\);/g;
s = s.replace(regex2, '');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Cleaned up script.js WhatsApp injections!');
