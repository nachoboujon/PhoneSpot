const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexReadonly = /readonly title="El stock total se calcula con las variantes"/g;
s = s.replace(regexReadonly, '');

const updateBasicOld = `            window.updateProductBasic = async (id) => {
                const price = document.getElementById(\`price-\${id}\`).value;
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(\`\${window.API_URL}/api/products/\${id}\`, {
                        method: 'PUT',
                        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ price })
                    });`;

const updateBasicNew = `            window.updateProductBasic = async (id) => {
                const price = document.getElementById(\`price-\${id}\`).value;
                const stock = document.getElementById(\`stock-\${id}\`).value;
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(\`\${window.API_URL}/api/products/\${id}\`, {
                        method: 'PUT',
                        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ price, stock })
                    });`;

s = s.replace(updateBasicOld, updateBasicNew);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed stock editing in admin');
