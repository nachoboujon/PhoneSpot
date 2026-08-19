const fs = require('fs');

const svgTemplate = (content) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg viewBox="0 0 300 50" xmlns="http://www.w3.org/2000/svg">${content}</svg>`)}`;

const brands = [
    { name: 'Apple', src: 'https://cdn.simpleicons.org/apple/000000' },
    { name: 'Samsung', src: 'https://cdn.simpleicons.org/samsung/000000' },
    { name: 'Motorola', src: 'https://cdn.simpleicons.org/motorola/000000' },
    { name: 'Xiaomi', src: 'https://cdn.simpleicons.org/xiaomi/000000' },
    { name: 'JBL', src: 'https://cdn.simpleicons.org/jbl/000000' },
    { name: 'OnePlus', src: 'https://cdn.simpleicons.org/oneplus/000000' },
    { name: 'Sony', src: 'https://cdn.simpleicons.org/sony/000000' },
    { name: 'Asus', src: 'https://cdn.simpleicons.org/asus/000000' },
    { name: 'Nokia', src: 'https://cdn.simpleicons.org/nokia/000000' },
    { name: 'Lenovo', src: 'https://cdn.simpleicons.org/lenovo/000000' },
    { name: 'Infinix', src: svgTemplate(`<text x="150" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="38" text-anchor="middle" fill="#000">Infinix</text>`) },
    { name: 'iTel', src: svgTemplate(`<text x="150" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="45" letter-spacing="-2" text-anchor="middle" fill="#000">itel</text>`) }
];

let slidesHtml = '';
// Build the slides HTML
brands.forEach(b => {
    slidesHtml += `                    <div class="logo-slide"><img src="${b.src}" alt="${b.name}" style="max-height: 45px; width: auto;"></div>\n`;
});
// Duplicate for seamless infinite loop
brands.forEach(b => {
    slidesHtml += `                    <div class="logo-slide"><img src="${b.src}" alt="${b.name}" style="max-height: 45px; width: auto;"></div>\n`;
});

let html = fs.readFileSync('public/index.html', 'utf8');
const regex = /<div class="logo-track">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(regex, '<div class="logo-track">\n' + slidesHtml + '                </div>\n            </div>');
fs.writeFileSync('public/index.html', html, 'utf8');

// Update CSS for the new count (12 original brands -> 24 total)
let css = fs.readFileSync('public/style.css', 'utf8');
// Use a regex that catches any previous width calc
css = css.replace(/width: calc\(250px \* \d+\);/, `width: calc(250px * 24);`);
css = css.replace(/100% \{ transform: translateX\(calc\(-250px \* \d+\)\); \}/, `100% { transform: translateX(calc(-250px * 12)); }`);
fs.writeFileSync('public/style.css', css, 'utf8');

console.log('Done replacing logos!');
