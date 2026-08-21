const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const fallbackWA = `
// Fallback WhatsApp Button (En caso de que falle la carga de settings o tarde mucho)
setTimeout(() => {
    if (!document.getElementById('wa-float-btn')) {
        const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
        const waBtn = document.createElement('a');
        waBtn.id = 'wa-float-btn';
        waBtn.href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
        waBtn.className = 'whatsapp-float fade-up visible';
        waBtn.target = '_blank';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        document.body.appendChild(waBtn);
    }
}, 1000);
`;

s += '\n' + fallbackWA;
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added WA fallback logic');
