from pathlib import Path
p=Path('public/script.js');s=p.read_text(encoding='utf-8')
marker='                    if (uniqueColors.length > 0) {'
addition='''                    const configurations = [...new Set(prod.variants.map(v => v.configuration).filter(Boolean))];
                    if (configurations.length) {
                        variantsHTML += `<select class="var-select" data-type="configuration" aria-label="Configuración" onchange="window.updateCardVariant(this)">${configurations.map(c => `<option value="${c}">${c}</option>`).join('')}</select>`;
                    }
'''
assert s.count(marker)==2, s.count(marker)
s=s.replace(marker,addition+marker)
marker='                            ${uniqueCaps.length > 0 ? `'
addition='''                            ${prod.variants.some(v => v.configuration) ? `
                            <div class="product-option-group">
                                <h3>Configuración</h3>
                                <div class="product-option-list" id="configuration-opts">
                                    ${[...new Set(prod.variants.map(v => v.configuration).filter(Boolean))].map((c,i) => `<button type="button" class="var-btn ${i===0?'active':''}" data-type="configuration" data-val="${c}" aria-pressed="${i===0}">${c}</button>`).join('')}
                                </div>
                            </div>` : ''}
'''
assert s.count(marker)==1
s=s.replace(marker,addition+marker)
# Creating a variant in either admin form supports configurations; price/stock edits already spread existing fields.
s=s.replace('<input type="text" class="var-ram"', '<input type="text" class="var-configuration" placeholder="Configuración (CPU / pantalla)" aria-label="Configuración" style="flex:1; min-width:180px;">\n                    <input type="text" class="var-ram"')
s=s.replace("const ram = row.querySelector('.var-ram').value.trim();", "const ram = row.querySelector('.var-ram').value.trim();\n                const configuration = row.querySelector('.var-configuration')?.value.trim() || '';")
s=s.replace('                        condition: variantCondition,','                        condition: variantCondition,\n                        configuration,')
s=s.replace('<input type="text" id="new-ram-${p.id}"', '<input type="text" id="new-configuration-${p.id}" placeholder="Configuración (CPU / pantalla)" aria-label="Configuración" style="padding:0.2rem; width:200px;">\n                                        <input type="text" id="new-ram-${p.id}"')
s=s.replace("const ram = document.getElementById(`new-ram-${id}`).value.trim();", "const ram = document.getElementById(`new-ram-${id}`).value.trim();\n                const configuration = document.getElementById(`new-configuration-${id}`)?.value.trim() || '';")
s=s.replace("capacity: cap || '', ram, batt, condition, stock, price", "capacity: cap || '', ram, batt, condition, configuration, stock, price")
p.write_text(s,encoding='utf-8')
p=Path('public/admin.html');s=p.read_text(encoding='utf-8');s=s.replace('<input type="text" class="var-ram"','<input type="text" class="var-configuration" placeholder="Configuración (CPU / pantalla)" aria-label="Configuración" style="flex:1; min-width:180px;">\n                                    <input type="text" class="var-ram"');p.write_text(s,encoding='utf-8')
