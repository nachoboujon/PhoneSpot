const fs = require('fs');
let s = fs.readFileSync('public/catalogo.html', 'utf8');

const target = `<input type="checkbox" checked style="accent-color: #555555; width: 18px; height: 18px;">
                            Nuevo, Caja Sellada
                        </label>`;

const replacement = `<input type="checkbox" checked style="accent-color: #555555; width: 18px; height: 18px;">
                            Nuevo, Caja Sellada
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" id="americano-filter" style="accent-color: #555555; width: 18px; height: 18px;">
                            Equipos Americanos (iPhone)
                        </label>`;

s = s.replace(target, replacement);
fs.writeFileSync('public/catalogo.html', s, 'utf8');
console.log('Condicion updated in catalogo.html');
