const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Update loadAdminSettings
s = s.replace(/if\(document\.getElementById\('set-flash-date'\)\) \{[^}]+\}/, `if(document.getElementById('set-flash-date')) {
                        document.getElementById('set-flash-date').value = currentSettings.flash_end_date || '';
                    }
                    if(document.getElementById('set-brands-list')) {
                        document.getElementById('set-brands-list').value = currentSettings.brands_list || '';
                    }`);

// 2. Update Admin save function
s = s.replace(/if\(document\.getElementById\('set-flash-date'\)\) \{\s*currentSettings\.flash_end_date = document\.getElementById\('set-flash-date'\)\.value;\s*\}/, `if(document.getElementById('set-flash-date')) {
                    currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                }
                if(document.getElementById('set-brands-list')) {
                    currentSettings.brands_list = document.getElementById('set-brands-list').value;
                }`);


// 3. Update Catalog logic: Extract dynamic brands and the Americanos dynamic injection block
const regexCatalog = /\/\/ Extract dynamic brands[\s\S]*?\/\/ Attach Event Listeners to brand checkboxes/i;

const replacementCatalog = `// Build dynamic brands
                let availableBrands = [];
                if (window.phoneSpotSettings && window.phoneSpotSettings.brands_list) {
                    availableBrands = window.phoneSpotSettings.brands_list.split(',').map(b => b.trim()).filter(b => b);
                } else {
                    availableBrands = [...new Set(products.map(p => (p.brand||'').trim()).filter(b => b))].sort();
                }
                
                if (brandFiltersContainer) {
                    brandFiltersContainer.innerHTML = '';
                    availableBrands.forEach(b => {
                        const isChecked = selectedBrands.includes(b.toLowerCase()) ? 'checked' : '';
                        brandFiltersContainer.innerHTML += \`
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                                <input type="checkbox" value="\${b.toLowerCase()}" class="brand-checkbox" \${isChecked} style="accent-color: #555555; width: 18px; height: 18px;">
                                \${b}
                            </label>
                        \`;
                    });

                    // Wiring existing Americanos filter from HTML
                    const americanoFilter = document.getElementById('americano-filter');
                    if (americanoFilter) {
                        americanoFilter.addEventListener('change', (e) => {
                            onlyAmericanos = e.target.checked;
                            renderFilteredCatalog();
                        });
                    }

                    // Attach Event Listeners to brand checkboxes`;

if (s.match(regexCatalog)) {
    s = s.replace(regexCatalog, () => replacementCatalog);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Script updated with admin brands logic and fixed Americanos filter!');
} else {
    console.log('Regex for catalog brands failed.');
}

