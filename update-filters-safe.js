const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// Rename Usado to swap_americano in the logic
script = script.replace(/if \(selectedConditions\.includes\('usado'\) && \(combined\.includes\('usado'\) \|\| combined\.includes\('seminuevo'\)\)\) matchesCond = true;/, `if (selectedConditions.includes('swap_americano') && (combined.includes('swap') || combined.includes('americano') || combined.includes('usado') || combined.includes('seminuevo'))) matchesCond = true;`);

// Safely remove Americanos logic from top globals
script = script.replace(/let onlyAmericanos = false;/g, '');

// Safely remove event listener logic
script = script.replace(/const americanoFilter = document\.getElementById\('americano-filter'\);\s*if \(americanoFilter\) \{\s*americanoFilter\.addEventListener\('change', \(e\) => \{\s*onlyAmericanos = e\.target\.checked;\s*renderFilteredCatalog\(\);\s*\}\);\s*\}/, '');

// Safely remove filter logic inside renderFilteredCatalog
script = script.replace(/\/\/ Americanos Filter\s*if \(onlyAmericanos\) \{\s*const str = \(p\.name \+ " " \+ \(p\.description\|\|''\)\)\.toLowerCase\(\);\s*if \(!str\.includes\('americano'\) && !str\.includes\('usa'\) && !str\.includes\('libre de f'\)\) return false;\s*\}/, '');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js safely updated');
