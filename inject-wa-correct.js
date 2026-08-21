const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target = 'window.phoneSpotSettings = data;';
const injection = `window.phoneSpotSettings = data;
        
        // Inyectar Boton WA Dynamico
        if (!document.getElementById('wa-float-btn')) {
            const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
            const waBtn = document.createElement('a');
            waBtn.id = 'wa-float-btn';
            waBtn.href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
            waBtn.className = 'whatsapp-float fade-up visible';
            waBtn.target = '_blank';
            waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
            document.body.appendChild(waBtn);
        } else {
            const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
            document.getElementById('wa-float-btn').href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
        }`;

s = s.replace(target, injection);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Injected clean WhatsApp button correctly!');
