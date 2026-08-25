const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Inject textarea in admin table
const searchHtml = `<p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: \${p.category} | Marca: \${p.brand}</p>
                                    </div>`;
const replaceHtml = `<p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: \${p.category} | Marca: \${p.brand}</p>
                                        <textarea id="desc-\${p.id}" rows="2" style="width:100%; margin-top:0.5rem; font-size:0.8rem; padding:0.3rem;" placeholder="Descripción">\${p.description || ''}</textarea>
                                    </div>`;
s = s.replace(searchHtml, replaceHtml);

// 2. Update updateProductBasic logic
const searchJs = `window.updateProductBasic = async (id) => {
                const price = document.getElementById(\`price-\${id}\`).value;
                const stock = document.getElementById(\`stock-\${id}\`).value;`;
const replaceJs = `window.updateProductBasic = async (id) => {
                const price = document.getElementById(\`price-\${id}\`).value;
                const stock = document.getElementById(\`stock-\${id}\`).value;
                const description = document.getElementById(\`desc-\${id}\`) ? document.getElementById(\`desc-\${id}\`).value : undefined;`;
s = s.replace(searchJs, replaceJs);

const searchBody = `body: JSON.stringify({ price, stock })`;
const replaceBody = `body: JSON.stringify({ price, stock, description })`;
s = s.replace(searchBody, replaceBody);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added description editing in admin UI');
