const fs = require('fs');

// 1. Fix admin.html carousel image input
let adminHtml = fs.readFileSync('public/admin.html', 'utf8');
adminHtml = adminHtml.replace('<label>URL de Imagen de Fondo</label>', '<label>Subir Imagen de Fondo</label>');
adminHtml = adminHtml.replace('<input type="text" id="set-car-img" required placeholder="https://...">', '<input type="file" id="set-car-img" accept="image/*" required>');
fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('Fixed admin.html carousel input to type="file"');

// 2. Remove floating unplash decorative phones from script.js carousel generator
let script = fs.readFileSync('public/script.js', 'utf8');
const startTag = '<!-- Floating Decoratives -->';
const endTag = '<div class="hero-content"';
const start = script.indexOf(startTag);
const end = script.indexOf(endTag, start);
if (start > -1 && end > -1) {
    script = script.substring(0, start) + script.substring(end);
    
    // 3. Fix the "los cuadros con las fotos arruinan el fondo"
    // The hero-content has a solid background blur box that might look bad on mobile if it blocks the background image.
    // Let's make it transparent on mobile, or remove the background box on mobile.
    // In style.css or inline.
    script = script.replace('background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); padding: 4rem; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);', 'background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 90%; max-width: 600px;');
    
    // We also need to fix how the admin form handles the new file upload!
    // We need to change the listener for #admin-carousel-form.
    const uploadLogic = `
                carouselForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const title = document.getElementById('set-car-title').value.trim();
                    const subtitle = document.getElementById('set-car-subtitle').value.trim();
                    const link = document.getElementById('set-car-link').value.trim();
                    
                    const fileInput = document.getElementById('set-car-img');
                    if(fileInput.files.length === 0) return showToast('Selecciona una imagen de fondo', 'fa-image');
                    
                    const btn = carouselForm.querySelector('button[type="submit"]');
                    const oldBtnHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
                    btn.disabled = true;

                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);

                    try {
                        const token = localStorage.getItem('phonespot_token');
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
                    }
                });
    `;
    
    // Replace the old form listener
    const oldFormListenerStart = script.indexOf("carouselForm.addEventListener('submit'");
    const oldFormListenerEnd = script.indexOf("});", script.indexOf("carouselForm.reset();", oldFormListenerStart)) + 3;
    
    if (oldFormListenerStart > -1 && oldFormListenerEnd > -1) {
        script = script.substring(0, oldFormListenerStart) + uploadLogic + script.substring(oldFormListenerEnd);
    }
    
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Fixed script.js for carousel uploads, layout, and decoratives');
}
