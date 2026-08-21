const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBadBlock = /let hasVariants = prod\.variants && prod\.variants\.length > 0;\s*if \(hasVariants\) \{[\s\S]*?window\.checkVariantStock\(prod\);\s*\}/;

const goodBlock = `let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    
                    variantsHTML = \`
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
                    \`;
                }`;

s = s.replace(regexBadBlock, goodBlock);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Restored variantsHTML');
