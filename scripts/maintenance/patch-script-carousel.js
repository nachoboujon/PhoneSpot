const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const targetList = `                        <div class="slide-item">
                            <div class="slide-info">
                                <h5>\${slide.title}</h5>
                                <p>\${slide.subtitle} | Link: \${slide.link}</p>
                            </div>
                            <button type="button" class="btn-danger" onclick="deleteSlide(\${index})"><i class="fa-solid fa-trash"></i></button>
                        </div>`;
const replList = `                        <div class="slide-item">
                            <div class="slide-info">
                                <h5>\${slide.title}</h5>
                                <p>\${slide.subtitle} | Link: \${slide.link}</p>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button type="button" class="btn" style="background:#0071e3; color:white; padding:0.4rem;" onclick="window.editSlide(\${index})"><i class="fa-solid fa-pen"></i></button>
                                <button type="button" class="btn-danger" onclick="deleteSlide(\${index})"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>`;
s = s.replace(targetList, replList);

const targetDelete = `            window.deleteSlide = (index) => {
                if(confirm('¿íSeguro que deseas eliminar está slide?')) {
                    currentSettings.carousel.splice(index, 1);
                    renderAdminCarouselList();
                    saveSettings();
                }
            };`;
const replDelete = `            window.deleteSlide = (index) => {
                if(confirm('¿Seguro que deseas eliminar esta slide?')) {
                    currentSettings.carousel.splice(index, 1);
                    renderAdminCarouselList();
                    saveSettings();
                }
            };
            
            window.editSlide = (index) => {
                const slide = currentSettings.carousel[index];
                document.getElementById('set-car-title').value = slide.title;
                document.getElementById('set-car-subtitle').value = slide.subtitle;
                document.getElementById('set-car-link').value = slide.link;
                document.getElementById('set-car-edit-index').value = index;
                
                const btn = document.getElementById('car-submit-btn');
                if(btn) btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
                const cancelBtn = document.getElementById('car-cancel-btn');
                if(cancelBtn) cancelBtn.style.display = 'inline-block';
                
                document.getElementById('admin-carousel-form').scrollIntoView({behavior: 'smooth'});
            };
            
            window.cancelEditCarousel = () => {
                document.getElementById('admin-carousel-form').reset();
                document.getElementById('set-car-edit-index').value = '';
                const btn = document.getElementById('car-submit-btn');
                if(btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir al Carrusel';
                const cancelBtn = document.getElementById('car-cancel-btn');
                if(cancelBtn) cancelBtn.style.display = 'none';
            };`;
s = s.replace(targetDelete, replDelete);

const targetSubmit = `                    const fileInput = document.getElementById('set-car-img');
                    if(fileInput.files.length === 0) return showToast('Selecciona una imagen de fondo', 'fa-image');
                    
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
                        if (data.url) {
                            if(!currentSettings.carousel) currentSettings.carousel = [];
                            currentSettings.carousel.push({
                                title, subtitle, link, image: data.url
                            });
                            await saveSettings();
                            carouselForm.reset();
                            renderAdminCarouselList();
                        } else {
                            throw new Error('Error al subir imagen');
                        }
                    } catch(err) {
                        showToast('Error al procesar la imagen', 'fa-times');
                    } finally {
                        btn.innerHTML = oldBtnHTML;
                        btn.disabled = false;
                    }`;

const replSubmit = `                    const fileInput = document.getElementById('set-car-img');
                    const editIndex = document.getElementById('set-car-edit-index').value;
                    const isEditing = editIndex !== '';
                    
                    if(!isEditing && fileInput.files.length === 0) {
                        return showToast('Selecciona una imagen de fondo', 'fa-image');
                    }
                    
                    const btn = carouselForm.querySelector('button[type="submit"]');
                    const oldBtnHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
                    btn.disabled = true;

                    try {
                        let imageUrl = '';
                        if (fileInput.files.length > 0) {
                            const formData = new FormData();
                            formData.append('image', fileInput.files[0]);
                            const token = localStorage.getItem('phoneSpotToken');
                            const res = await fetch(window.API_URL + '/api/upload', {
                                method: 'POST',
                                headers: { 'Authorization': 'Bearer ' + token },
                                body: formData
                            });
                            const data = await res.json();
                            if (data.url) {
                                imageUrl = data.url;
                            } else {
                                throw new Error('Error al subir imagen');
                            }
                        } else if (isEditing) {
                            // Keep existing image
                            imageUrl = currentSettings.carousel[parseInt(editIndex)].image;
                        }

                        if(!currentSettings.carousel) currentSettings.carousel = [];
                        
                        if (isEditing) {
                            currentSettings.carousel[parseInt(editIndex)] = { title, subtitle, link, image: imageUrl };
                        } else {
                            currentSettings.carousel.push({ title, subtitle, link, image: imageUrl });
                        }
                        
                        await saveSettings();
                        window.cancelEditCarousel();
                        renderAdminCarouselList();
                        
                    } catch(err) {
                        showToast('Error al procesar el carrusel', 'fa-times');
                    } finally {
                        btn.innerHTML = oldBtnHTML;
                        btn.disabled = false;
                    }`;
s = s.replace(targetSubmit, replSubmit);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Patched script.js for carousel editing');
