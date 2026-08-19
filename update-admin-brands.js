const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<input type="datetime-local" id="set-flash-date">[\s\S]*?<\/div>/;

const replacement = `<input type="datetime-local" id="set-flash-date">
                        </div>
                        <div class="form-group">
                            <label>Marcas a mostrar en el Catálogo (separadas por coma)</label>
                            <input type="text" id="set-brands-list" placeholder="Ej: Apple, Samsung, Xiaomi, Motorola, JBL">
                        </div>`;

if(s.match(regex)) {
    s = s.replace(regex, replacement);
    fs.writeFileSync('public/admin.html', s, 'utf8');
    console.log('Added brands field to admin.html');
} else {
    console.log('Could not find regex in admin.html');
}
