const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexVariantsHTML = /variantsHTML = `[\s\S]*?<p id="variant-stock-msg"[\s\S]*?<\/div>\s*`;/;

const newVariantsHTML = `variantsHTML = \`
                        <div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">
                            \${uniqueColors.length > 0 ? \`
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Color</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:12px;" id="color-opts">
                                    \${uniqueColors.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="color" data-val="\${c}" style="padding:14px 28px; background:#fff; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:30px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}

                            \${uniqueCaps.length > 0 ? \`
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Almacenamiento</h4>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;" id="cap-opts">
                                    \${uniqueCaps.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="capacity" data-val="\${c}" style="padding:22px 10px; background:#fff; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:18px; font-weight:700; font-size:1.1rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; text-align:center;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}

                            \${uniqueRams.length > 0 ? \`
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Memoria RAM</h4>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;" id="ram-opts">
                                    \${uniqueRams.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="ram" data-val="\${c}" style="padding:22px 10px; background:#fff; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:18px; font-weight:700; font-size:1.1rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; text-align:center;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            
                            <p id="variant-stock-msg" style="font-size:0.95rem; margin-top:0.5rem; font-weight:bold;"></p>
                        </div>
                    \`;`;

s = s.replace(regexVariantsHTML, newVariantsHTML);

// Find the checkVariantStock logic blocks to remove the background `#f5f5f7` changes so it matches the new pure border style.

const logicReplace1 = /firstValid\.style\.background = '#f5f5f7';/g;
s = s.replace(logicReplace1, "firstValid.style.background = '#fff';");

const logicReplace2 = /e\.target\.style\.background = '#f5f5f7';/g;
s = s.replace(logicReplace2, "e.target.style.background = '#fff';");

const logicReplace3 = /el\.style\.background = '#fff';/g;
s = s.replace(logicReplace3, "el.style.background = '#fff';"); // just for consistency

// Also make the hover effect on variant buttons via JS since CSS hover pseudo class is not easily added without global styles
// Oh wait, I can just inject a global style tag in index.html for .var-btn:hover!
// Or I can add a small style block directly in the script.
const styleInject = `
                    variantsHTML = \`
                        <style>
                            .var-btn:hover:not(.disabled-variant) {
                                border-color: #888 !important;
                            }
                            .var-btn.active {
                                border-color: #0071e3 !important;
                            }
                        </style>
                        <div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">
`;

s = s.replace('<div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">', `<style>
                            .var-btn:hover { border-color: #999 !important; }
                            .var-btn.active { border-color: #0071e3 !important; }
                        </style>
                        <div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">`);


fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Applied MaximStore Apple style variants');
