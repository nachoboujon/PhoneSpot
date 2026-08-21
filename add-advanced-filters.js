const fs = require('fs');

let script = fs.readFileSync('public/script.js', 'utf8');

// Add globals
script = script.replace(/let selectedBrands = \[\];/, 'let selectedBrands = [];\nlet selectedConditions = [];\nlet selectedColors = [];');

// Add Event listeners logic for the new filters
const newListeners = `
                    document.querySelectorAll('.cond-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedConditions.push(e.target.value);
                            else selectedConditions = selectedConditions.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });

                    document.querySelectorAll('.color-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedColors.push(e.target.value);
                            else selectedColors = selectedColors.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });
                    
                    // Enforce mobile closed by default programmatically
                    if(window.innerWidth <= 768) {
                        document.querySelectorAll('#filters-sidebar details').forEach(d => d.removeAttribute('open'));
                    }
`;

// Insert the listeners where brand-checkbox listeners are attached
script = script.replace(/renderFilteredCatalog\(\);\s*\}\);\s*\}\);\s*\}/, (match) => {
    return match.replace(/}$/, newListeners + '}');
});

// Update renderFilteredCatalog logic
const newFilterLogic = `
                // Conditions Filter
                if (selectedConditions.length > 0) {
                    const desc = (p.description || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const combined = name + " " + desc;
                    
                    let matchesCond = false;
                    if (selectedConditions.includes('nuevo') && !combined.includes('usado') && !combined.includes('reacondicionado') && !combined.includes('seminuevo')) matchesCond = true;
                    if (selectedConditions.includes('usado') && (combined.includes('usado') || combined.includes('seminuevo'))) matchesCond = true;
                    if (selectedConditions.includes('reacondicionado') && (combined.includes('reacondicionado') || combined.includes('refurbished'))) matchesCond = true;
                    
                    if (!matchesCond) return false;
                }

                // Colors Filter
                if (selectedColors.length > 0) {
                    const desc = (p.description || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const combined = name + " " + desc;
                    
                    // Simple color matching based on text
                    let matchesColor = selectedColors.some(color => {
                        if (color === 'negro' && (combined.includes('negro') || combined.includes('black') || combined.includes('oscuro') || combined.includes('midnight'))) return true;
                        if (color === 'blanco' && (combined.includes('blanco') || combined.includes('white') || combined.includes('plata') || combined.includes('silver') || combined.includes('starlight'))) return true;
                        if (color === 'azul' && (combined.includes('azul') || combined.includes('blue') || combined.includes('cyan'))) return true;
                        if (color === 'titanium' && (combined.includes('titanium') || combined.includes('titanio') || combined.includes('gris') || combined.includes('gray') || combined.includes('grey'))) return true;
                        return combined.includes(color);
                    });
                    
                    if (!matchesColor) return false;
                }
`;

// Insert inside the `filtered = allCatalogProducts.filter(p => {`
script = script.replace(/\/\/ Price Filter/g, newFilterLogic + '\n                // Price Filter');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js updated with advanced filter logic');
