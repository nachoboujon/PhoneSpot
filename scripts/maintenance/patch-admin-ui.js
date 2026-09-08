const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target1 = `                                        <input type="number" id="stock-\${p.id}" value="\${p.stock}" style="width:70px; padding:0.2rem;" >
                                        
                                        <button onclick="updateProductBasic(\${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Precio</button>`;

const repl1 = `                                        <input type="number" id="stock-\${p.id}" value="\${p.stock}" style="width:70px; padding:0.2rem;" \${(p.variants && p.variants.length > 0) ? 'disabled title="El stock se edita desde Variantes/Colores" style="background:#eee; width:70px; padding:0.2rem;"' : ''}>
                                        
                                        <button onclick="updateProductBasic(\${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Info</button>`;

s = s.replace(target1, repl1);

const target2 = `                    if (res.ok && hasVariants) {
                        showToast('Precio guardado. (El stock se edita en Variantes)', 'fa-check');
                    }
                    
                    if(res.ok) {
                        showToast('Precio actualizado', 'fa-check');`;

const repl2 = `                    if (res.ok) {
                        showToast('Datos actualizados', 'fa-check');`;

s = s.replace(target2, repl2);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed UI for admin panel');
