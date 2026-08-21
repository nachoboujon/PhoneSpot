const fs = require('fs');

const replacements = [
    { from: /TambiǸn te podra interesar/g, to: 'También te podría interesar' },
    { from: /TǸrminos y Condiciones/g, to: 'Términos y Condiciones' },
    { from: /Garantas/g, to: 'Garantías' },
    { from: /Polticas de Envo/g, to: 'Políticas de Envío' },
    { from: /San JosǸǸǸ/g, to: 'San José' },
    { from: /San Josééé/g, to: 'San José' },
    { from: /Coln/g, to: 'Colón' },
    { from: /Entre Ros/g, to: 'Entre Ríos' },
    { from: /Catǭlogo/g, to: 'Catálogo' },
    { from: /garanta/g, to: 'garantía' },
    { from: /Lunes a Sǭbados/g, to: 'Lunes a Sábados' },
    { from: /tecnologa mvil/g, to: 'tecnología móvil' },
    { from: /Informacin/g, to: 'Información' },
    { from: /dueos/g, to: 'dueños' },
    { from: /Hola PhoneSpot! Vengo de su pǭgina web y me gustara hacer una consulta./g, to: '¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.' },
    { from: /Cargando producto\.\.\./g, to: 'Cargando producto...' },
    { from: /El contenido se cargarǭ dinǭmicamente con JS/g, to: 'El contenido se cargará dinámicamente con JS' },
    { from: /JS inyectarǭ los productos aqu/g, to: 'JS inyectará los productos aquí' },
    { from: /San JosǸ/g, to: 'San José' },
    { from: /Hola PhoneSpot! Vengo de su pǭgina web y me gustara hacer una consulta\./g, to: '¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.' },
    { from: /Catlogo/g, to: 'Catálogo' },
    { from: /Trminos/g, to: 'Términos' }
];

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
files.push('script.js'); // Include script.js

files.forEach(file => {
    const path = file === 'script.js' ? 'public/script.js' : 'public/' + file;
    let content = fs.readFileSync(path, 'utf8');
    let changed = false;
    for (const rule of replacements) {
        if (content.match(rule.from)) {
            content = content.replace(rule.from, rule.to);
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed encoding in ' + file);
    }
});

