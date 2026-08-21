const fs = require('fs');
let html = fs.readFileSync('public/catalogo.html', 'utf8');

// Remove Color Filter
const colorBlock = /<div class="filter-section">\s*<div class="filter-title active" onclick="toggleFilter\(this\)">\s*<span><i class="fa-solid fa-palette".*?<\/div>\s*<\/div>/s;
html = html.replace(colorBlock, '');

// Rename Usado to Swap Americano, and change its value to swap_americano
html = html.replace(/<input type="checkbox" value="usado" class="cond-checkbox"[^>]*>\s*Usado \/ Seminuevo/, '<input type="checkbox" value="swap_americano" class="cond-checkbox" style="accent-color: #555555; width: 18px; height: 18px;"> Swap Americano');

// Remove Americanos Promo
const promoBlock = /<label class="toggle-label filter-label" style="justify-content: space-between;">\s*<span style="display: flex; align-items: center; gap:10px;"><i class="fa-solid fa-plane".*?<\/label>/s;
html = html.replace(promoBlock, '');

fs.writeFileSync('public/catalogo.html', html, 'utf8');
console.log('catalogo.html updated');

let script = fs.readFileSync('public/script.js', 'utf8');
// Update the logic in script.js for "swap_americano"
// It used to say:
// if (selectedConditions.includes('usado') && (combined.includes('usado') || combined.includes('seminuevo'))) matchesCond = true;
script = script.replace(/if \(selectedConditions\.includes\('usado'\).*?matchesCond = true;/s, `if (selectedConditions.includes('swap_americano') && (combined.includes('swap') || combined.includes('americano') || combined.includes('usado') || combined.includes('seminuevo'))) matchesCond = true;`);

// Remove Americanos filter logic
// let onlyAmericanos = false;
// ...
// const americanoFilter = document.getElementById('americano-filter');
// ...
script = script.replace(/let onlyAmericanos = false;/g, '');
script = script.replace(/const americanoFilter = document\.getElementById\('americano-filter'\);\s*if \(americanoFilter\) \{[\s\S]*?\}\s*\}/, '');
script = script.replace(/\/\/ Americanos Filter[\s\S]*?if \(onlyAmericanos\) \{[\s\S]*?\}\s*\}/, '');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js updated');
