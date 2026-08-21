const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Fix double $$
s = s.replace(/\$\$\{window\.formatPrice/g, '${window.formatPrice');

// 2. Fix images URL
const helper = `
// ==================== IMAGE HELPER ====================
window.getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return window.API_URL + url;
};
// ======================================================
`;

if (!s.includes('window.getFullImageUrl')) {
    s = s.replace('// ==================== DOLAR BLUE ====================', helper + '\n// ==================== DOLAR BLUE ====================');
}

s = s.replace(/prod\.image_url\s*\|\|/g, 'window.getFullImageUrl(prod.image_url) ||');

// For slide.image
s = s.replace(/url\('\\$\\{slide\.image\\}'\)/g, "url('${window.getFullImageUrl(slide.image)}')");
s = s.replace(/<img src="\\$\\{slide\.image\\}"/g, '<img src="${window.getFullImageUrl(slide.image)}"');

// For cart
s = s.replace(/\\$\\{item\.img \\|\\| item\.image \\|\\| item\.image_url\\}/g, '${window.getFullImageUrl(item.img || item.image || item.image_url)}');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed visuals');
