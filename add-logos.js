const fs = require('fs');

const logos = [
    { src: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', alt: 'Apple' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg', alt: 'Samsung' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg', alt: 'Xiaomi' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Motorola_logo.svg', alt: 'Motorola' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/JBL_logo.svg', alt: 'JBL' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Huawei_logo.svg', alt: 'Huawei' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Realme_logo.svg', alt: 'Realme' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg', alt: 'Sony' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/OPPO_LOGO_2019.svg', alt: 'Oppo' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Vivo_mobile_logo.svg', alt: 'Vivo' },
    { src: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Infinix_logo.svg', alt: 'Infinix' }, // Different wikimedia link just in case
];

let slidesHtml = '';
logos.forEach(logo => {
    slidesHtml += `                    <div class="logo-slide"><img src="${logo.src}" alt="${logo.alt}"></div>\n`;
});
// Duplicate
logos.forEach(logo => {
    slidesHtml += `                    <div class="logo-slide"><img src="${logo.src}" alt="${logo.alt}"></div>\n`;
});

let html = fs.readFileSync('public/index.html', 'utf8');
const regex = /<div class="logo-track">[\s\S]*?<\/div>\s*<\/div>/;
html = html.replace(regex, '<div class="logo-track">\n' + slidesHtml + '                </div>\n            </div>');
fs.writeFileSync('public/index.html', html, 'utf8');

let css = fs.readFileSync('public/style.css', 'utf8');
css = css.replace(/width: calc\(250px \* \d+\);/, 'width: calc(250px * 22);');
css = css.replace(/100% \{ transform: translateX\(calc\(-250px \* \d+\)\); \}/, '100% { transform: translateX(calc(-250px * 11)); }');
fs.writeFileSync('public/style.css', css, 'utf8');
