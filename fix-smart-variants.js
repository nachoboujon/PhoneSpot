const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexToReplace = /window\.checkVariantStock = \(prodArg\) => \{[\s\S]*?window\.checkVariantStock\(prod\);\s*\}/;

const newLogic = `window.checkVariantStock = (prodArg) => {
                        let colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        let capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        let ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        
                        let selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        let selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        let selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;

                        let variants = [];
                        if (prodArg.variants && Array.isArray(prodArg.variants)) variants = prodArg.variants;

                        // 1. Filtrar Capacidades basadas en el Color seleccionado
                        if (selectedColor) {
                            const validCaps = variants.filter(v => v.color === selectedColor).map(v => v.capacity);
                            document.querySelectorAll('.var-btn[data-type="capacity"]').forEach(btn => {
                                const val = btn.getAttribute('data-val');
                                if (!validCaps.includes(val)) {
                                    btn.style.opacity = '0.3';
                                    btn.style.pointerEvents = 'none';
                                    btn.style.textDecoration = 'line-through';
                                    if (selectedCap === val) selectedCap = null;
                                } else {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.textDecoration = 'none';
                                }
                            });
                        }
                        
                        // Auto-seleccionar capacidad si quedó vacía
                        if (!selectedCap) {
                            const firstValid = Array.from(document.querySelectorAll('.var-btn[data-type="capacity"]')).find(b => b.style.pointerEvents !== 'none');
                            if (firstValid) {
                                document.querySelectorAll('.var-btn[data-type="capacity"]').forEach(el => {
                                    el.classList.remove('active');
                                    el.style.borderColor = '#e5e5ea';
                                    el.style.background = '#fff';
                                });
                                firstValid.classList.add('active');
                                firstValid.style.borderColor = '#0071e3';
                                firstValid.style.background = '#f5f5f7';
                                selectedCap = firstValid.getAttribute('data-val');
                            }
                        }

                        // 2. Filtrar RAM basada en Color y Capacidad seleccionados
                        if (selectedColor && selectedCap) {
                            const validRams = variants.filter(v => v.color === selectedColor && v.capacity === selectedCap).map(v => v.ram);
                            document.querySelectorAll('.var-btn[data-type="ram"]').forEach(btn => {
                                const val = btn.getAttribute('data-val');
                                if (!validRams.includes(val)) {
                                    btn.style.opacity = '0.3';
                                    btn.style.pointerEvents = 'none';
                                    btn.style.textDecoration = 'line-through';
                                    if (selectedRam === val) selectedRam = null;
                                } else {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.textDecoration = 'none';
                                }
                            });
                        }

                        // Auto-seleccionar RAM si quedó vacía
                        if (!selectedRam) {
                            const firstValid = Array.from(document.querySelectorAll('.var-btn[data-type="ram"]')).find(b => b.style.pointerEvents !== 'none');
                            if (firstValid) {
                                document.querySelectorAll('.var-btn[data-type="ram"]').forEach(el => {
                                    el.classList.remove('active');
                                    el.style.borderColor = '#e5e5ea';
                                    el.style.background = '#fff';
                                });
                                firstValid.classList.add('active');
                                firstValid.style.borderColor = '#0071e3';
                                firstValid.style.background = '#f5f5f7';
                                selectedRam = firstValid.getAttribute('data-val');
                            }
                        }

                        // 3. Buscar el stock real de la combinación ganadora
                        let stockToUse = prodArg.stock;
                        if (variants.length > 0) {
                            const v = variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                            } else {
                                stockToUse = 0;
                            }
                        }

                        // 4. Actualizar Botones y Textos
                        const btn = document.querySelector('.add-to-cart-btn');
                        const stockLabel = document.getElementById('variant-stock-msg');
                        
                        if (stockToUse <= 0) {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Sin Stock de este color/modelo';
                                btn.disabled = true;
                                btn.style.background = '#ccc';
                                btn.style.cursor = 'not-allowed';
                            }
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#ff4757;"><i class="fa-solid fa-times-circle"></i> Agotado en esta combinación</span>';
                        } else {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al carrito';
                                btn.disabled = false;
                                btn.style.background = '#0071e3'; 
                                btn.style.cursor = 'pointer';
                            }
                            if (stockLabel) stockLabel.innerHTML = \`<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"></i> Stock disponible: \${stockToUse} unidades</span>\`;
                        }
                    };

                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const type = e.target.getAttribute('data-type');
                            document.querySelectorAll(\`[data-type="\${type}"]\`).forEach(el => {
                                el.classList.remove('active');
                                el.style.borderColor = '#e5e5ea';
                                el.style.background = '#fff';
                            });
                            e.target.classList.add('active');
                            e.target.style.borderColor = '#0071e3';
                            e.target.style.background = '#f5f5f7';
                            window.checkVariantStock(prod);
                        });
                    });
                    
                    window.checkVariantStock(prod);
                }`;

if (s.match(regexToReplace)) {
    s = s.replace(regexToReplace, newLogic);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed dynamic variant filtering!');
} else {
    console.log('Could not match regex for checkVariantStock');
}
