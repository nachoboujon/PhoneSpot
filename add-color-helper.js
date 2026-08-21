const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const colorHelper = `
window.getColorHex = (colorName) => {
    const name = colorName.toLowerCase().trim();
    if (name.includes('negro') || name.includes('black') || name.includes('oscuro')) return '#1e1e1e';
    if (name.includes('blanco') || name.includes('white') || name.includes('claro')) return '#f9f6ef';
    if (name.includes('plata') || name.includes('silver')) return '#e3e4e6';
    if (name.includes('gris') || name.includes('grey') || name.includes('gray')) return '#737373';
    if (name.includes('azul') || name.includes('blue')) return '#215e7c';
    if (name.includes('rojo') || name.includes('red')) return '#a50011';
    if (name.includes('rosa') || name.includes('pink')) return '#fcdbce';
    if (name.includes('oro') || name.includes('gold') || name.includes('dorado')) return '#f6e2ce';
    if (name.includes('titanio natural')) return '#b5b3a9';
    if (name.includes('titanio azul')) return '#383b40';
    if (name.includes('titanio blanco')) return '#e3e4e6';
    if (name.includes('titanio negro')) return '#222324';
    if (name.includes('verde') || name.includes('green')) return '#d0d9d2';
    if (name.includes('amarillo') || name.includes('yellow')) return '#fce473';
    if (name.includes('violeta') || name.includes('purple')) return '#d5c7d9';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};
`;

if (!s.includes('window.getColorHex')) {
    s = s.replace("document.addEventListener('DOMContentLoaded', () => {", colorHelper + "\n\ndocument.addEventListener('DOMContentLoaded', () => {");
}

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added color helper');
