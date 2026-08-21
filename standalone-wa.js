const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const waLogic = `
window.initWhatsApp = async () => {
    try {
        let phone = '5493447416011';
        try {
            const res = await fetch(window.API_URL + '/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.whatsapp_number) phone = data.whatsapp_number;
            }
        } catch (e) {
            console.error('No se pudo cargar config WA', e);
        }

        if (!document.getElementById('wa-float-btn')) {
            const waBtn = document.createElement('a');
            waBtn.id = 'wa-float-btn';
            waBtn.href = \`https://wa.me/\${phone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
            waBtn.className = 'whatsapp-float fade-up visible';
            waBtn.target = '_blank';
            waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
            document.body.appendChild(waBtn);
        } else {
            document.getElementById('wa-float-btn').href = \`https://wa.me/\${phone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
        }
    } catch(e) {}
};
window.initWhatsApp();
`;

// Replace my previous injected block inside applyFrontendSettings
const regexRemove = /\/\/ Inyectar WhatsApp[\s\S]*?\}\s*\}/;
if(s.match(regexRemove)){
    s = s.replace(regexRemove, '}');
    console.log('Removed from inside applyFrontendSettings');
}

// Append to the end of the file
s += '\n' + waLogic;

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Appended standalone WhatsApp initializer!');
