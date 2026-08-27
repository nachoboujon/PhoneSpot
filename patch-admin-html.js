const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

const targetHtml = `                            <div class="form-group">
                                <label>Subir Imagen de Fondo</label>
                                <input type="file" id="set-car-img" accept="image/*" required>
                            </div>
                        </div>
                        <button type="submit" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"></i> Añadir al Carrusel</button>
                    </form>`;

const replHtml = `                            <div class="form-group">
                                <label>Subir Imagen de Fondo</label>
                                <input type="file" id="set-car-img" accept="image/*">
                                <small style="color:var(--text-muted); display:block; margin-top:0.3rem;">Déjalo vacío al editar si quieres mantener la imagen actual.</small>
                            </div>
                        </div>
                        <input type="hidden" id="set-car-edit-index" value="">
                        <div style="display:flex; gap: 1rem;">
                            <button type="submit" id="car-submit-btn" class="btn" style="background-color: #555555;"><i class="fa-solid fa-plus"></i> Añadir al Carrusel</button>
                            <button type="button" id="car-cancel-btn" class="btn" style="background-color: #999; display:none;" onclick="window.cancelEditCarousel()">Cancelar</button>
                        </div>
                    </form>`;

s = s.replace(targetHtml, replHtml);
fs.writeFileSync('public/admin.html', s, 'utf8');
console.log('Patched admin.html for carousel editing');
