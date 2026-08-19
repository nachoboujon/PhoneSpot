const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<select id="prod-category">[\s\S]*?<\/select>\s*<\/div>/;

const replacement = `<select id="prod-category">
                                    <option value="celulares">Celulares</option>
                                    <option value="notebooks">Notebooks</option>
                                    <option value="tablets">Tablets</option>
                                    <option value="accesorios">Accesorios</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Condición del Equipo</label>
                                <select id="prod-condition">
                                    <option value="Nuevo, Caja Sellada">Nuevo, Caja Sellada</option>
                                    <option value="Americano">Equipos Americanos (iPhone)</option>
                                    <option value="Usado / Reacondicionado">Usado / Reacondicionado</option>
                                </select>
                            </div>`;

if(s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/admin.html', s, 'utf8');
    console.log('Added condition field to admin.html');
} else {
    console.log('Regex failed');
}
