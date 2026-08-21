const fs = require('fs');

// 1. FIX CAROUSEL INLINE STYLES IN SCRIPT.JS
let s = fs.readFileSync('public/script.js', 'utf8');
const regexTitle = /<h2 class="carousel-title" style="([^"]*?)font-size:\s*4rem;([^"]*?)">/g;
s = s.replace(regexTitle, '<h2 class="carousel-title" style="$1$2">');

const regexSub = /<p class="carousel-subtitle" style="([^"]*?)font-size:\s*1\.4rem;([^"]*?)">/g;
s = s.replace(regexSub, '<p class="carousel-subtitle" style="$1$2">');
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed inline carousel sizes in script.js');

// 2. FIX HORIZONTAL SCROLL IN CATALOGO.HTML
let cat = fs.readFileSync('public/catalogo.html', 'utf8');
cat = cat.replace(/style="flex:\s*1;\s*min-width:\s*300px;"/g, 'style="flex: 1; min-width: 0;"');
fs.writeFileSync('public/catalogo.html', cat, 'utf8');
console.log('Fixed catalog min-width');
