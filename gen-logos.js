const fs = require('fs');

const svgTemplate = (content) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg viewBox="0 0 300 50" xmlns="http://www.w3.org/2000/svg">${content}</svg>`)}`;

const brands = [
    { name: 'Apple', svg: `<path d="M149.8 41.5c-4.4 0-6.8-3.5-6.8-9.4 0-6.1 2.9-9.1 7.1-9.1 1.8 0 3.8.8 4.8 1.9.9-1 3.2-1.9 5.3-1.9 4.6 0 7.2 3.1 7.2 9.1 0 6.1-2.9 9.4-7.2 9.4-1.2 0-2.8-.5-3.8-1.1-.9.6-2.2 1.1-3.8 1.1zm2.3-19.9c-1.8 0-3.3 1.5-3.3 3.6 1.8 0 3.3-1.5 3.3-3.6z" fill="#000" transform="scale(1.2) translate(-25, -15)"/>` },
    { name: 'Samsung', svg: `<text x="150" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="35" letter-spacing="-1" text-anchor="middle" fill="#000">SAMSUNG</text>` },
    { name: 'Motorola', svg: `<circle cx="150" cy="25" r="18" fill="none" stroke="#000" stroke-width="4"/><path d="M138 30 Q144 14 150 24 Q156 14 162 30" fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` },
    { name: 'Xiaomi', svg: `<rect x="125" y="5" width="50" height="40" rx="10" fill="#000"/><text x="150" y="33" font-family="Arial, sans-serif" font-weight="bold" font-size="25" text-anchor="middle" fill="#fff">mi</text>` },
    { name: 'JBL', svg: `<rect x="115" y="5" width="70" height="40" fill="#000"/><text x="150" y="35" font-family="Arial, sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#fff">JBL</text>` },
    { name: 'Infinix', svg: `<text x="150" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#000">Infinix</text>` },
    { name: 'iTel', svg: `<text x="150" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="45" letter-spacing="-2" text-anchor="middle" fill="#000">itel</text>` },
    { name: 'Huawei', svg: `<text x="150" y="35" font-family="Arial, sans-serif" font-weight="bold" font-size="30" letter-spacing="2" text-anchor="middle" fill="#000">HUAWEI</text>` },
    { name: 'TCL', svg: `<rect x="115" y="5" width="70" height="40" rx="5" fill="#000"/><text x="150" y="35" font-family="Arial, sans-serif" font-weight="bold" font-size="28" text-anchor="middle" fill="#fff">TCL</text>` },
    { name: 'Sony', svg: `<text x="150" y="38" font-family="Times New Roman, serif" font-weight="bold" font-size="40" letter-spacing="2" text-anchor="middle" fill="#000">SONY</text>` }
];

let slidesHtml = '';
// Build the slides HTML
brands.forEach(b => {
    slidesHtml += `                    <div class="logo-slide"><img src="${svgTemplate(b.svg)}" alt="${b.name}"></div>\n`;
});
// Duplicate for seamless infinite loop
brands.forEach(b => {
    slidesHtml += `                    <div class="logo-slide"><img src="${svgTemplate(b.svg)}" alt="${b.name}"></div>\n`;
});

let html = fs.readFileSync('public/index.html', 'utf8');
const regex = /<div class="logo-track">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(regex, '<div class="logo-track">\n' + slidesHtml + '                </div>\n            </div>');
fs.writeFileSync('public/index.html', html, 'utf8');

// Update CSS for the new count (10 original brands -> 20 total)
let css = fs.readFileSync('public/style.css', 'utf8');
css = css.replace(/width: calc\(250px \* \d+\);/, `width: calc(250px * 20);`);
css = css.replace(/100% \{ transform: translateX\(calc\(-250px \* \d+\)\); \}/, `100% { transform: translateX(calc(-250px * 10)); }`);
fs.writeFileSync('public/style.css', css, 'utf8');
