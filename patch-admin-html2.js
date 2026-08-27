const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

// The file input line
s = s.replace('<input type="file" id="set-car-img" accept="image/*" required>', '<input type="file" id="set-car-img" accept="image/*">\n                                <small style="color:var(--text-muted); display:block; margin-top:0.3rem;">Déjalo vacío al editar si quieres mantener la imagen actual.</small>');

// The submit button and end of form
s = s.replace('<button type="submit" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"></i> Añadir al Carrusel</button>\n                    </form>', '<input type="hidden" id="set-car-edit-index" value="">\n                        <div style="display:flex; gap: 1rem;">\n                            <button type="submit" id="car-submit-btn" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"></i> Añadir al Carrusel</button>\n                            <button type="button" id="car-cancel-btn" class="btn" style="background-color: #999; display:none;" onclick="window.cancelEditCarousel()">Cancelar</button>\n                        </div>\n                    </form>');

fs.writeFileSync('public/admin.html', s, 'utf8');
console.log('Fixed admin.html!');
