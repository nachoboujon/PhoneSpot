const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const calcZipLogic = `
                // Manejo de envío de reseña
                const reviewForm = document.getElementById('review-form');

                // Lógica de cálculo de envío por código postal
                const calcBtn = document.getElementById('calc-btn');
                const zipInput = document.getElementById('calc-zip');
                const zipMsg = document.getElementById('zip-msg');
                if (calcBtn && zipInput && zipMsg) {
                    calcBtn.addEventListener('click', () => {
                        const cp = zipInput.value.trim();
                        if (!cp || cp.length < 3) {
                            zipMsg.style.color = '#e74c3c';
                            zipMsg.innerText = 'Por favor ingresa un código postal válido.';
                            zipMsg.style.display = 'block';
                            return;
                        }
                        
                        // CP Origen: 3283
                        zipMsg.style.color = 'var(--text-color)';
                        if (cp === '3283' || cp === '3280') {
                            zipMsg.innerHTML = '<span style="color:#2ecc71; font-weight:bold;"><i class="fa-solid fa-store"></i> ¡Estás cerca!</span> Puedes retirar gratis por nuestro local, o coordinar cadetería local.';
                        } else {
                            const costoCorreo = window.phoneSpotSettings?.shipping_correo || 8500;
                            const costoAndreani = window.phoneSpotSettings?.shipping_andreani || 12000;
                            
                            zipMsg.innerHTML = \`
                                <strong>Opciones de envío a CP \${cp} (Desde CP 3283):</strong><br>
                                <i class="fa-solid fa-box"></i> Correo Argentino (3-6 días): <strong>\$\${costoCorreo.toLocaleString('es-AR')} ARS</strong><br>
                                <i class="fa-solid fa-truck-fast"></i> Andreani (1-3 días): <strong>\$\${costoAndreani.toLocaleString('es-AR')} ARS</strong>
                            \`;
                        }
                        zipMsg.style.display = 'block';
                    });
                }
`;

// Only inject if it's not already there
if (!s.includes('calcBtn.addEventListener')) {
    s = s.replace("// Manejo de envío de reseña\n                const reviewForm = document.getElementById('review-form');", calcZipLogic);
}

// Also let's fix the two hardcoded images issue:
const oldThumbs = `<img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Trasera">
                                    <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Lateral">`;
if (s.includes(oldThumbs)) {
    s = s.replace(oldThumbs, '');
}

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed thumbnails and zip code logic');
