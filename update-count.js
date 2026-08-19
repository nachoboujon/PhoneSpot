const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

const updateCountCode = `
                  // Actualizar contador visual
                  const countLabel = document.getElementById('catalog-count-label');
                  if (countLabel) {
                      countLabel.innerText = 'Mostrando ' + filtered.length + ' producto' + (filtered.length === 1 ? '' : 's');
                  }
`;

s = s.replace(/fullCatalogContainer\.innerHTML = '';/, "fullCatalogContainer.innerHTML = '';" + updateCountCode);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Script updated successfully.');
