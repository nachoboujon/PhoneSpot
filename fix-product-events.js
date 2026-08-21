const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexStart = s.indexOf('let variantsHTML = \'\';');
const regexEnd = s.indexOf('// Lógica Calculador Zip Code');

if (regexStart > -1 && regexEnd > -1) {
    const originalBlock = s.substring(regexStart, regexEnd);
    
    const newBlock = `let variantsHTML = '';
                let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    
                    variantsHTML = \`
                        <div style="margin-bottom:2rem;" id="variant-selector">
                            \${uniqueColors.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Color</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="color-opts">
                                    \${uniqueColors.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="color" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueCaps.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Capacidad</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="cap-opts">
                                    \${uniqueCaps.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="capacity" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueRams.length > 0 ? \`
                            <div style="margin-bottom:1.5rem;">
                                <h4 style="font-size:0.95rem; margin-bottom:0.8rem; font-weight:600; color:#1d1d1f;">Memoria RAM</h4>
                                <div style="display:flex; flex-wrap:wrap; gap:0.8rem;" id="ram-opts">
                                    \${uniqueRams.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="ram" data-val="\${c}" style="padding:0.8rem 1.2rem; background:\${i===0?'#f5f5f7':'#fff'}; border: 2px solid \${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            <p id="variant-stock-msg" style="font-size:0.95rem; margin-top:0.5rem; font-weight:bold;"></p>
                        </div>
                    \`;
                }

                // Calcular rating de reviews
                let avgRating = 4.8;
                let numReviews = reviews.length > 0 ? reviews.length : 24;
                if(reviews.length > 0) {
                    avgRating = (reviews.reduce((a,b) => a + b.rating, 0) / reviews.length).toFixed(1);
                }

                let starsHtml = '';
                for(let i=1; i<=5; i++) {
                    if (i <= Math.floor(avgRating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                    else if (i - avgRating < 1) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                    else starsHtml += '<i class="fa-regular fa-star"></i>';
                }

                singleProductContainer.innerHTML = \`
                    <div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">
                        <div class="product-details" data-id="\${prod.id}" data-price="\${prod.price}" data-stock-info="\${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="display:grid; grid-template-columns:1fr 1.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">
                            <div class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="position: relative; overflow: hidden; border-radius: 16px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                                    \${prod.stock <= 0 ? \`<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#333; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">AGOTADO</div>\` : (prod.is_offer ? \`<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>\` : '')}
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
                                
                                <div style="margin-bottom:1.5rem;">
                                    \${!hasVariants ? \`<p style="font-size:0.95rem; font-weight:bold; color: \${prod.stock > 0 ? '#2ecc71' : '#ff4757'};"><i class="fa-solid \${prod.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> \${prod.stock > 0 ? 'Stock disponible: ' + prod.stock + ' unidades' : 'Sin stock'}</p>\` : ''}
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
                        </div>
                    </div>
                \`;

                // AHORA SÍ CONECTAMOS LOS EVENTOS, DESPUÉS DE INNER HTML
                if (hasVariants) {
                    window.checkVariantStock = (prodArg) => {
                        const colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        const capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        const ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        
                        const selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        const selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        const selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;

                        let stockToUse = prodArg.stock;
                        let variantName = '';
                        
                        if (prodArg.variants && prodArg.variants.length > 0) {
                            const v = prodArg.variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                variantName = [v.color, v.capacity, v.ram].filter(Boolean).join(' - ');
                            } else {
                                stockToUse = 0;
                            }
                        }

                        const btn = document.querySelector('.add-to-cart-btn');
                        const stockLabel = document.getElementById('variant-stock-msg');
                        
                        if (stockToUse <= 0) {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Sin Stock';
                                btn.disabled = true;
                                btn.style.background = '#ccc';
                                btn.style.cursor = 'not-allowed';
                            }
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#ff4757;"><i class="fa-solid fa-times-circle"></i> Combinación agotada</span>';
                        } else {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al carrito';
                                btn.disabled = false;
                                btn.style.background = '#0071e3'; 
                                btn.style.cursor = 'pointer';
                            }
                            if (stockLabel) stockLabel.innerHTML = \`<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"></i> Stock disponible: \${stockToUse} unidades</span>\`;
                        }
                    };

                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const type = e.target.getAttribute('data-type');
                            document.querySelectorAll(\`[data-type="\${type}"]\`).forEach(el => {
                                el.classList.remove('active');
                                el.style.borderColor = '#e5e5ea';
                                el.style.background = '#fff';
                            });
                            e.target.classList.add('active');
                            e.target.style.borderColor = '#0071e3';
                            e.target.style.background = '#f5f5f7';
                            window.checkVariantStock(prod);
                        });
                    });
                    
                    window.checkVariantStock(prod);
                }

                `;
    
    s = s.substring(0, regexStart) + newBlock + s.substring(regexEnd);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed entire product HTML and event binding!');
} else {
    console.log('Could not find start or end block');
}
