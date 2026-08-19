const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. We inject onlyOffers boolean
const targetVars = `let onlyAmericanos = false;
        let currentSort = '';`;

const repVars = `let onlyAmericanos = false;
        let onlyOffers = false;
        let currentSort = '';`;

if (s.includes(targetVars)) s = s.replace(targetVars, repVars);

// 2. We inject the offer filtering logic in renderFilteredCatalog()
const targetFilter = `// Americanos Filter
                if (onlyAmericanos) {`;

const repFilter = `// Offers Filter
                if (onlyOffers && !p.is_offer) {
                    return false;
                }

                // Americanos Filter
                if (onlyAmericanos) {`;

if (s.includes(targetFilter)) s = s.replace(targetFilter, repFilter);

// 3. We wire up the event listener
const targetEvents = `const americanoFilter = document.getElementById('americano-filter');`;

const repEvents = `const offerFilter = document.getElementById('offer-filter');
                    if (offerFilter) {
                        offerFilter.addEventListener('change', (e) => {
                            onlyOffers = e.target.checked;
                            renderFilteredCatalog();
                        });
                    }

                    const americanoFilter = document.getElementById('americano-filter');`;

if (s.includes(targetEvents)) s = s.replace(targetEvents, repEvents);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('script.js updated with offer filter logic!');
