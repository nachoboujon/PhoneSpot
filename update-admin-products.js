const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Replace the product list item HTML and logic in script.js
const adminHTML = `
                    prods.forEach(p => {
                        window[\`adminProduct_\${p.id}\`] = p; // save product data globally for easy access
                        productListContainer.innerHTML += \`
                            <div class="slide-item" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                    <div style="flex:2;">
                                        <h5 style="margin:0;">\${p.name}</h5>
                                        <p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: \${p.category} | Marca: \${p.brand}</p>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <label style="font-size:0.8rem;">Precio (USD):</label>
                                        <input type="number" id="price-\${p.id}" value="\${p.price}" style="width:80px; padding:0.2rem;">
                                        
                                        <label style="font-size:0.8rem;">Stock:</label>
                                        <input type="number" id="stock-\${p.id}" value="\${p.stock}" style="width:70px; padding:0.2rem;" readonly title="El stock total se calcula con las variantes">
                                        
                                        <button onclick="updateProductBasic(\${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Precio</button>
                                        <button onclick="toggleVariantsEdit(\${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:var(--text-color);">Variantes/Colores</button>
                                        <button onclick="deleteProduct(\${p.id})" class="btn-danger" style="padding:0.3rem 0.5rem;"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                                <div id="variants-edit-\${p.id}" style="display:none; padding:1rem; background:var(--bg-color); border-radius:8px; border:1px dashed var(--border-color);">
                                    <h6 style="margin-bottom:0.5rem;">Variantes (Colores/Capacidad)</h6>
                                    <div id="variants-list-\${p.id}" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;"></div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <input type="text" id="new-color-\${p.id}" placeholder="Color (ej. Azul)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-cap-\${p.id}" placeholder="Capacidad (ej. 128GB)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-ram-\${p.id}" placeholder="RAM (ej. 8GB)" style="padding:0.2rem; width:120px;">
                                        <input type="number" id="new-vstock-\${p.id}" placeholder="Stock" style="padding:0.2rem; width:70px;">
                                        <button onclick="addVariantToProduct(\${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#2ecc71; color:#fff;">+ Agregar Variante</button>
                                    </div>
                                </div>
                            </div>
                        \`;
                    });
`;

s = s.replace(/prods\.forEach\(p => \{[\s\S]+?\}\);/, adminHTML);

const adminFunctions = `
            window.updateProductBasic = async (id) => {
                const price = document.getElementById(\`price-\${id}\`).value;
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(\`http://localhost:3000/api/products/\${id}\`, {
                        method: 'PUT',
                        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ price })
                    });
                    if(res.ok) {
                        showToast('Precio actualizado', 'fa-check');
                        loadAdminData();
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };

            window.toggleVariantsEdit = (id) => {
                const div = document.getElementById(\`variants-edit-\${id}\`);
                const isHidden = div.style.display === 'none';
                div.style.display = isHidden ? 'block' : 'none';
                if (isHidden) renderProductVariants(id);
            };

            window.renderProductVariants = (id) => {
                const p = window[\`adminProduct_\${id}\`];
                const list = document.getElementById(\`variants-list-\${id}\`);
                if (!p || !list) return;
                
                let variants = [];
                try { variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants; } catch(e){}
                if (!variants || !Array.isArray(variants)) variants = [];
                
                window[\`adminProductVariants_\${id}\`] = variants; // keep track of parsed variants

                list.innerHTML = variants.map((v, index) => \`
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f5f7; padding:0.5rem; border-radius:4px;">
                        <span style="font-size:0.85rem;">\${v.color} - \${v.capacity} - \${v.ram} (Stock: \${v.stock})</span>
                        <button onclick="removeVariantFromProduct(\${id}, \${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                    </div>
                \`).join('');
            };

            window.addVariantToProduct = async (id) => {
                const color = document.getElementById(\`new-color-\${id}\`).value.trim();
                const cap = document.getElementById(\`new-cap-\${id}\`).value.trim();
                const ram = document.getElementById(\`new-ram-\${id}\`).value.trim();
                const stock = parseInt(document.getElementById(\`new-vstock-\${id}\`).value) || 0;
                
                if (!color || !cap) return showToast('Color y Capacidad son obligatorios', 'fa-exclamation');

                let variants = window[\`adminProductVariants_\${id}\`] || [];
                variants.push({ color, capacity: cap, ram, stock });
                
                await saveVariantsToDB(id, variants);
            };

            window.removeVariantFromProduct = async (id, index) => {
                let variants = window[\`adminProductVariants_\${id}\`] || [];
                variants.splice(index, 1);
                await saveVariantsToDB(id, variants);
            };

            const saveVariantsToDB = async (id, variants) => {
                const token = localStorage.getItem('phoneSpotToken');
                const totalStock = variants.reduce((acc, v) => acc + (parseInt(v.stock)||0), 0);
                
                showToast('Actualizando variantes...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(\`http://localhost:3000/api/products/\${id}\`, {
                        method: 'PUT',
                        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ variants, stock: totalStock })
                    });
                    if(res.ok) {
                        showToast('Variantes actualizadas', 'fa-check');
                        loadAdminData(); // re-fetch products
                    } else {
                        showToast('Error en el servidor', 'fa-times');
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };
`;

s = s.replace(/window\.updateStock = async \(id\) => \{[\s\S]+?\}\s*\};\s*window\.deleteProduct/, adminFunctions + '\n            window.deleteProduct');
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Updated admin logic for products inline edit');
