const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Remove JS logic for price range
s = s.replace(/let maxPriceFilter = 3000000;\n/g, '');
s = s.replace(/const priceRange = document\.getElementById\('price-range'\);\n/g, '');
s = s.replace(/if \(Number\(p\.price\) > maxPriceFilter\) return false;\n/g, '');
s = s.replace(/if \(priceRange\) \{\s*priceRange\.addEventListener\('input', \(e\) => \{\s*maxPriceFilter = Number\(e\.target\.value\);\s*if \(priceLabel\) priceLabel\.innerText = window\.formatPrice\(maxPriceFilter\);\s*renderFilteredCatalog\(\);\s*\}\);\s*\}\n/g, '');
s = s.replace(/const priceLabel = document\.getElementById\('price-label'\);\n/g, '');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Removed price filter JS logic');
