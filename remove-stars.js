const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

// Catalogo stars
const catStars = /<div class="stars" style="color: #f1c40f; margin-bottom: 0\.5rem; font-size: 0\.9rem;">[\s\S]*?<\/div>/g;
s = s.replace(catStars, '');

// Producto.html stars logic
const prodStarsLogic = /let starsHtml = '';[\s\S]*?<\/div>\s*<\/div>/;
s = s.replace(prodStarsLogic, '');

// Related Products stars
const relStars = /<div style="color: #f1c40f; font-size: 0\.8rem; margin-bottom: 0\.5rem;">[\s\S]*?<\/div>/g;
s = s.replace(relStars, '');

// Other stars in card layouts
const otherStars = /<div class="stars">[\s\S]*?<\/div>/g;
s = s.replace(otherStars, '');

// Save changes
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Removed stars from JS');

// Also remove stars from HTML files if any
const htmlFiles = ['public/catalogo.html', 'public/index.html', 'public/producto.html'];
for (let file of htmlFiles) {
    if (fs.existsSync(file)) {
        let html = fs.readFileSync(file, 'utf8');
        html = html.replace(/<div class="stars"[\s\S]*?<\/div>/g, '');
        fs.writeFileSync(file, html, 'utf8');
    }
}
