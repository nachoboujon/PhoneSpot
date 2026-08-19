const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldGallery = `<div class="product-gallery">
                                \${prod.is_offer ? \`<div class="badge" style="position:absolute; background:#ff4757; color:white; padding:0.5rem 1rem; font-weight:bold; border-radius:4px;">OFERTA</div>\` : ''}
                                <img src="\${image}" alt="\${prod.name}" style="width:100%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
                            </div>`;

const newGallery = `<div class="product-gallery">
                                \${prod.is_offer ? \`<div class="badge" style="position:absolute; background:#ff4757; color:white; padding:0.5rem 1rem; font-weight:bold; border-radius:4px;">OFERTA</div>\` : ''}
                                <div style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                    <img id="main-product-img" src="\${image}" alt="\${prod.name}" style="width:100%; display:block; transition: transform 0.3s; cursor: zoom-in;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onmousemove="const rect=this.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;this.style.transformOrigin=\`\${x*100}% \${y*100}%\`;">
                                </div>
                                <div class="gallery-thumbnails">
                                    <img src="\${image}" class="gallery-thumb active" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');">
                                    <img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Trasera">
                                    <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Lateral">
                                </div>
                            </div>`;

s = s.replace(oldGallery, newGallery);
fs.writeFileSync('public/script.js', s, 'utf8');
