const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

s = s.replace(/<button type="submit" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"><\/i> Añadir al Carrusel<\/button>\s*<\/form>/, 
`<input type="hidden" id="set-car-edit-index" value="">
                        <div style="display:flex; gap: 1rem;">
                            <button type="submit" id="car-submit-btn" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"></i> Añadir al Carrusel</button>
                            <button type="button" id="car-cancel-btn" class="btn" style="background-color: #999; display:none;" onclick="window.cancelEditCarousel()">Cancelar</button>
                        </div>
                    </form>`);

fs.writeFileSync('public/admin.html', s, 'utf8');
console.log('Fixed admin.html button!');
