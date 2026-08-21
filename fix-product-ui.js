const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badChunk = `                    <div style="width: 100%;">
                        <div class="product-details" data-id="\${prod.id}" style="display:grid; grid-template-columns:1fr 1fr; gap:4rem; max-width:1000px; margin:0 auto; padding:2rem;">
                            <div class="product-gallery">
                                \${prod.is_offer ? \`<div class="badge" style="position:absolute; background:#ff4757; color:white; padding:0.5rem 1rem; font-weight:bold; border-radius:4px;">OFERTA</div>\` : ''}
                                <div style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                    <img id="main-product-img" src="\${image}" alt="\${prod.name}" style="width:100%; display:block; transition: transform 0.3s; cursor: zoom-in;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onmousemove="const rect=this.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;this.style.transformOrigin=(x*100) + '%' + ' ' + (y*100) + '%';">
                                </div>
                                <div class="gallery-thumbnails">
                                    <img src="\${image}" class="gallery-thumb active" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');">
                                    
                                </div>
                            </div>
                            <div class="product-info" style="display:flex; flex-direction:column; justify-content:center;">
                                <p style="color: var(--text-muted); font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">\${prod.brand} | \${prod.category}</p>
                                <h2 style="font-size:2.5rem; margin-bottom:0.5rem; color: var(--text-color);">\${prod.name}</h2>
                                <div class="product-rating" style="justify-content: flex-start; margin-bottom: 1rem; font-size: 1.1rem; display: flex; gap: 0.2rem; align-items: center;">
                                    \${starsHtml}
                                    <span style="margin-left: 0.5rem;">(\${avgRating}) - \${numReviews} Reseñas</span>
                                </div>
                                \${oldPrice}
                                <p class="price" style="font-size:2rem; font-weight:bold; color: var(--text-color); margin-bottom:1.5rem;">\${window.formatPrice(Number(prod.price))}</p>
                                
                                \${variantsHTML}

                                <!-- Calculador de Envíos -->
                                <div style="background: var(--gray-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-truck"></i> Calcula tu envío</h4>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="text" id="calc-zip" placeholder="Tu Código Postal" style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
                                        <button id="calc-btn" class="btn" style="padding: 0.5rem 1rem;">Calcular</button>
                                    </div>
                                    <p id="zip-msg" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); display: none;"></p>
                                </div>
                                
                                <p style="line-height:1.6; color: var(--text-muted); margin-bottom:2rem;">\${prod.description}</p>
                                
                                <div style="display:flex; gap:1rem; align-items:center;">
                                    <button class="btn add-to-cart-btn" style="flex:1; padding:1rem; font-size:1.1rem; \${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}" \${isOutOfStock ? 'disabled' : ''}>
                                        <i class="fa-solid \${isOutOfStock ? 'fa-box-open' : 'fa-cart-plus'}"></i> \${isOutOfStock ? 'Sin Stock' : 'Añadir al carrito'}
                                    </button>
                                </div>

                                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                                    <ul style="list-style:none; padding:0; margin:0; font-size:0.9rem; color: var(--text-muted);">
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-shield-halved" style="margin-right:10px; color:#555555;"></i> 12 meses de garantía oficial</li>
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-rotate-left" style="margin-right:10px; color:#555555;"></i> Devolución gratuita en 30 días</li>
                                        <li><i class="fa-solid fa-truck-fast" style="margin-right:10px; color: var(--text-color);"></i> <strong>Envío Inmediato</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>`;

const goodChunk = `                    <div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">
                        <div class="product-details" data-id="\${prod.id}" style="display:grid; grid-template-columns:1fr 1.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">
                            <div class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="position: relative; overflow: hidden; border-radius: 16px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                                    \${prod.is_offer ? \`<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>\` : ''}
                                    <img id="main-product-img" src="\${image}" alt="\${prod.name}" style="width:90%; display:block; transition: transform 0.4s ease; cursor: zoom-in; mix-blend-mode: multiply;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onmousemove="const rect=this.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;this.style.transformOrigin=(x*100) + '%' + ' ' + (y*100) + '%';">
                                </div>
                                <div class="gallery-thumbnails" style="display: flex; gap: 10px; justify-content: center;">
                                    <img src="\${image}" class="gallery-thumb active" style="width:70px; height:70px; object-fit:contain; border-radius:10px; cursor:pointer; padding:5px; background:#f5f5f7; border:2px solid #000;" onclick="document.getElementById('main-product-img').src=this.src;">
                                </div>
                            </div>
                            
                            <div class="product-info" style="display:flex; flex-direction:column; justify-content:flex-start;">
                                <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 0.8rem;">
                                    <span style="background: #e3e3e3; color: #333; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">\${prod.brand}</span>
                                    <span style="color: var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">\${prod.category}</span>
                                </div>
                                
                                <h2 style="font-size:2.4rem; font-weight:800; line-height:1.1; margin-bottom:1rem; color: #1d1d1f; letter-spacing:-0.5px;">\${prod.name}</h2>
                                
                                <div class="product-rating" style="justify-content: flex-start; margin-bottom: 1.5rem; font-size: 1rem; display: flex; gap: 0.2rem; align-items: center; color:#f5c518;">
                                    \${starsHtml}
                                    <span style="margin-left: 0.5rem; color:#555; font-size:0.9rem;">(\${avgRating}) - \${numReviews} Reseñas</span>
                                </div>
                                
                                <div style="background:#f9f9f9; padding: 1.2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #eee;">
                                    \${oldPrice}
                                    <p class="price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">\${window.formatPrice(Number(prod.price))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span></p>
                                </div>
                                
                                \${variantsHTML}

                                <!-- Calculador de Envíos Moderno -->
                                <div style="background: #fff; padding: 1.2rem; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 1.5rem; display:flex; flex-direction:column; gap:0.8rem; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                    <h4 style="font-size: 0.95rem; margin:0; color:#1d1d1f; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-truck-fast" style="color:#0071e3;"></i> Conocer tiempos y costos de envío</h4>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="text" id="calc-zip" placeholder="Tu CP (Ej: 3283)" style="flex: 1; padding: 0.7rem; border: 1px solid #ccc; border-radius: 8px; font-size:0.9rem; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#0071e3'" onblur="this.style.borderColor='#ccc'">
                                        <button id="calc-btn" style="padding: 0.7rem 1.2rem; background:#f5f5f7; color:#1d1d1f; border:none; border-radius:8px; font-weight:bold; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#e8e8ed'" onmouseout="this.style.background='#f5f5f7'">Calcular</button>
                                    </div>
                                    <p id="zip-msg" style="margin: 0; font-size: 0.85rem; color: #555; display: none; line-height:1.4;"></p>
                                </div>
                                
                                <div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">
                                    <button class="btn add-to-cart-btn" style="flex:1; padding:1.2rem; font-size:1rem; font-weight:bold; border-radius:12px; \${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}" \${isOutOfStock ? 'disabled' : ''}>
                                        <i class="fa-solid \${isOutOfStock ? 'fa-box-open' : 'fa-cart-plus'}"></i> \${isOutOfStock ? 'Sin Stock' : 'Añadir al carrito'}
                                    </button>
                                </div>

                                <div style="padding-top: 1.5rem; border-top: 1px solid #eee;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 1rem; color:#1d1d1f;">Descripción del producto</h4>
                                    <p style="line-height:1.7; color: #555; font-size:0.95rem;">\${prod.description}</p>
                                </div>

                                <div style="margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border-radius: 12px; display:flex; flex-direction:column; gap:0.8rem;">
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-shield-halved" style="color:#0071e3;"></i></div>
                                        <span>12 meses de <strong>garantía oficial</strong></span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-rotate-left" style="color:#0071e3;"></i></div>
                                        <span>Devolución <strong>gratuita en 30 días</strong></span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-truck-fast" style="color:#0071e3;"></i></div>
                                        <span><strong>Envío inmediato</strong> a todo el país</span>
                                    </div>
                                </div>
                            </div>
                        </div>`;

if (s.includes('max-width:1000px; margin:0 auto; padding:2rem;')) {
    s = s.replace(badChunk, goodChunk);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed UI');
} else {
    console.log('Not found badChunk');
}
