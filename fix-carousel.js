const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const oldHtmlChunk = `                            <div class="form-group">
                                <label>Link del botón (URL)</label>
                                <input type="text" id="set-car-link" required placeholder="catalogo.html?cat=apple">
                            </div>
                            <div class="form-group">
                                <label>URL de Imagen de Fondo</label>
                                <input type="text" id="set-car-img" required placeholder="https://...">
                            </div>`;

const newHtmlChunk = `                            <div class="form-group">
                                <label>¿A dónde lleva el botón?</label>
                                <select id="set-car-link" required style="width:100%; padding:0.8rem; border:1px solid var(--border-color); border-radius:8px; font-family:inherit;">
                                    <option value="catalogo.html">Catálogo Completo</option>
                                    <option value="catalogo.html?cat=apple">Apple (iPhone)</option>
                                    <option value="catalogo.html?cat=samsung">Samsung</option>
                                    <option value="catalogo.html?cat=motorola">Motorola</option>
                                    <option value="catalogo.html?cat=xiaomi">Xiaomi</option>
                                    <option value="catalogo.html?cat=notebooks">Notebooks</option>
                                    <option value="catalogo.html?cat=tablets">Tablets</option>
                                    <option value="catalogo.html?cat=accesorios">Accesorios</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Imagen de Fondo</label>
                                <input type="file" id="set-car-img" accept="image/*" required style="width:100%; padding:0.6rem; border:1px solid var(--border-color); border-radius:8px; background:#fff;">
                            </div>`;

html = html.replace(oldHtmlChunk, newHtmlChunk);
fs.writeFileSync('public/admin.html', html, 'utf8');

let js = fs.readFileSync('public/script.js', 'utf8');
const oldJsChunk = `            if(carouselForm) {
                carouselForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if(!currentSettings.carousel) currentSettings.carousel = [];
                    currentSettings.carousel.push({
                        title: document.getElementById('set-car-title').value,
                        subtitle: document.getElementById('set-car-subtitle').value,
                        link: document.getElementById('set-car-link').value,
                        image: document.getElementById('set-car-img').value
                    });
                    carouselForm.reset();
                    renderAdminCarouselList();
                    saveSettings();
                });
            }`;

const newJsChunk = `            if(carouselForm) {
                carouselForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const fileInput = document.getElementById('set-car-img');
                    if(fileInput.files.length === 0) return showToast('Selecciona una imagen primero', 'fa-image');
                    
                    const btn = carouselForm.querySelector('button[type="submit"]');
                    const oldBtnHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
                    btn.disabled = true;

                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);

                    try {
                        const token = localStorage.getItem('phoneSpotToken');
                        const res = await fetch(window.API_URL + '/api/upload', {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token },
                            body: formData
                        });
                        const data = await res.json();
                        
                        if (!res.ok) throw new Error(data.error);

                        if(!currentSettings.carousel) currentSettings.carousel = [];
                        currentSettings.carousel.push({
                            title: document.getElementById('set-car-title').value,
                            subtitle: document.getElementById('set-car-subtitle').value,
                            link: document.getElementById('set-car-link').value,
                            image: data.url
                        });
                        carouselForm.reset();
                        renderAdminCarouselList();
                        saveSettings();
                        showToast('Slide añadido con éxito');
                    } catch(err) {
                        showToast('Error al subir imagen', 'fa-triangle-exclamation');
                    } finally {
                        btn.innerHTML = oldBtnHTML;
                        btn.disabled = false;
                    }
                });
            }`;

js = js.replace(oldJsChunk, newJsChunk);
fs.writeFileSync('public/script.js', js, 'utf8');

console.log('Fixed carousel admin panel');
