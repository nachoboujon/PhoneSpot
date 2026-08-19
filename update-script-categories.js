const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. We inject selectedCategories and modify the initial check
const targetVars = `let selectedBrands = initialCat !== 'all' && ['apple','samsung','motorola','xiaomi'].includes(initialCat) ? [initialCat] : [];
        let maxPriceFilter = 3000000;`;

const repVars = `let selectedBrands = initialCat !== 'all' && ['apple','samsung','motorola','xiaomi'].includes(initialCat) ? [initialCat] : [];
        let selectedCategories = initialCat !== 'all' && ['celulares','notebooks','tablets','accesorios'].includes(initialCat) ? [initialCat] : [];
        let maxPriceFilter = 3000000;`;

if (s.includes(targetVars)) s = s.replace(targetVars, repVars);


// 2. We inject the category filtering logic in renderFilteredCatalog()
// The old category logic was:
const targetFilter = `// Category Filter (if initialCat was a category like 'celulares', not a brand)
                if (initialCat !== 'all' && !['apple','samsung','motorola','xiaomi'].includes(initialCat)) {
                    const str = (p.name + " " + p.description + " " + p.category).toLowerCase();
                    if (!str.includes(initialCat)) return false;
                }`;

const repFilter = `// Category Filter
                if (selectedCategories.length > 0) {
                    const str = (p.name + " " + p.description + " " + p.category).toLowerCase();
                    const matchesCat = selectedCategories.some(cat => str.includes(cat));
                    if (!matchesCat) return false;
                }`;

if (s.includes(targetFilter)) s = s.replace(targetFilter, repFilter);


// 3. We inject the event listener attachment and initial checkbox checking
const targetEvents = `// Attach Event Listeners to brand checkboxes`;

const repEvents = `// Check initial category boxes based on URL
                    document.querySelectorAll('.cat-checkbox').forEach(chk => {
                        if (selectedCategories.includes(chk.value)) chk.checked = true;
                        
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedCategories.push(e.target.value);
                            else selectedCategories = selectedCategories.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });

                    // Attach Event Listeners to brand checkboxes`;

if (s.includes(targetEvents)) s = s.replace(targetEvents, repEvents);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('script.js updated with category filter logic!');
