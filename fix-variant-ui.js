const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexVariantsHTML = /variantsHTML = `[\s\S]*?<p id="variant-stock-msg"[\s\S]*?<\/div>\s*`;/;

const newVariantsHTML = `variantsHTML = \`
                        <div style="margin-bottom:2rem;" id="variant-selector">
                            \${uniqueColors.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Color</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="color-opts">
                                    \${uniqueColors.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="color" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueCaps.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Capacidad</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="cap-opts">
                                    \${uniqueCaps.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="capacity" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueRams.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Memoria RAM</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="ram-opts">
                                    \${uniqueRams.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="ram" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            <p id="variant-stock-msg" style="font-size:0.95rem; margin-top:0.5rem; font-weight:bold;"></p>
                        </div>
                    \`;`;

s = s.replace(regexVariantsHTML, newVariantsHTML);

const oldVariantLogic = /if \(hasVariants\) \{[\s\S]*?btns\.forEach\(b => \{[\s\S]*?b\.addEventListener\('click', \(e\) => \{[\s\S]*?window\.checkVariantStock\(prod\);\s*\}\);\s*\}\);[\s\S]*?window\.checkVariantStock = \(prod\) => \{[\s\S]*?\}\);\s*window\.checkVariantStock\(prod\);\s*\}/;

const newVariantLogic = `if (hasVariants) {
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
                    
                    window.checkVariantStock = (prod) => {
                        const colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        const capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        const ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        
                        const selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        const selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        const selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;

                        let stockToUse = prod.stock;
                        let variantName = '';
                        
                        if (prod.variants && prod.variants.length > 0) {
                            const v = prod.variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                variantName = [v.color, v.capacity, v.ram].filter(Boolean).join(' - ');
                            } else {
                                stockToUse = 0;
                            }
                        }

                        const btn = document.querySelector('.add-to-cart-btn');
                        const stockLabel = document.getElementById('variant-stock-msg');
                        
                        if (stockToUse <= 0) {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Sin Stock';
                                btn.disabled = true;
                                btn.style.background = '#ccc';
                                btn.style.cursor = 'not-allowed';
                            }
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#ff4757;"><i class="fa-solid fa-times-circle"></i> Combinación agotada</span>';
                        } else {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al carrito';
                                btn.disabled = false;
                                btn.style.background = ''; // Reverts to CSS default or inline
                                btn.style.cursor = 'pointer';
                            }
                            if (stockLabel) stockLabel.innerHTML = \`<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"></i> Stock disponible: \${stockToUse} unidades</span>\`;
                        }
                    };
                    
                    window.checkVariantStock(prod);
                }`;

if(s.match(oldVariantLogic)) {
    s = s.replace(oldVariantLogic, newVariantLogic);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed variant buttons UX');
} else {
    console.log('Not found variant logic chunk to replace');
}
