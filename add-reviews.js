const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const s1 = s.substring(0, s.indexOf('// Lógica para Detalles de un Solo Producto'));
const s2 = s.substring(s.indexOf('    function loadRelatedProducts(currentId, category) {'));

const newLogic = `// Lógica para Detalles de un Solo Producto (producto.html)
    const singleProductContainer = document.getElementById('single-product-container');
    if (singleProductContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            singleProductContainer.innerHTML = '<p style="color:#ff4757; font-size:1.2rem;">Producto no encontrado (Falta ID).</p>';
        } else {
            Promise.all([
                fetch(\`http://localhost:3000/api/products/\${productId}\`).then(r => r.json()),
                fetch(\`http://localhost:3000/api/reviews/\${productId}\`).then(r => r.json()).catch(() => [])
            ]).then(([prod, reviews]) => {
                if (prod.error) {
                    singleProductContainer.innerHTML = \`<p style="color:#ff4757; font-size:1.2rem;">\${prod.error}</p>\`;
                    return;
                }
                
                document.title = \`\${prod.name} | PhoneSpot\`;
                const image = prod.image_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
                const isOutOfStock = prod.stock <= 0;
                const oldPrice = prod.is_offer ? \`<p class="old-price" style="text-decoration:line-through; color:#999; margin-bottom:0;">$\${(prod.price * 1.2).toLocaleString('es-AR')}</p>\` : '';

                let variantsHTML = '';
                let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    
                    variantsHTML = \`
                        <div style="margin-bottom:1.5rem;" id="variant-selector">
                            \${uniqueColors.length > 0 ? \`
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Color:</h4>
                                <div style="display:flex; gap:0.5rem;" id="color-opts">
                                    \${uniqueColors.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="color" data-val="\${c}" style="padding:0.3rem 0.8rem; border:1px solid #ccc; border-radius:4px; cursor:pointer;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueCaps.length > 0 ? \`
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Capacidad:</h4>
                                <div style="display:flex; gap:0.5rem;" id="cap-opts">
                                    \${uniqueCaps.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="capacity" data-val="\${c}" style="padding:0.3rem 0.8rem; border:1px solid #ccc; border-radius:4px; cursor:pointer;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            \${uniqueRams.length > 0 ? \`
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">RAM:</h4>
                                <div style="display:flex; gap:0.5rem;" id="ram-opts">
                                    \${uniqueRams.map((c,i) => \`<button class="var-btn \${i===0?'active':''}" data-type="ram" data-val="\${c}" style="padding:0.3rem 0.8rem; border:1px solid #ccc; border-radius:4px; cursor:pointer;">\${c}</button>\`).join('')}
                                </div>
                            </div>
                            \` : ''}
                            <p id="variant-stock-msg" style="font-size:0.85rem; color:#2e8b57; font-weight:bold;"></p>
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
                    <div style="width: 100%;">
                        <div class="product-details" data-id="\${prod.id}" style="display:grid; grid-template-columns:1fr 1fr; gap:4rem; max-width:1000px; margin:0 auto; padding:2rem;">
                            <div class="product-gallery">
                                \${prod.is_offer ? \`<div class="badge" style="position:absolute; background:#ff4757; color:white; padding:0.5rem 1rem; font-weight:bold; border-radius:4px;">OFERTA</div>\` : ''}
                                <img src="\${image}" alt="\${prod.name}" style="width:100%; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1);">
                            </div>
                            <div class="product-info" style="display:flex; flex-direction:column; justify-content:center;">
                                <p style="color:#666; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">\${prod.brand} | \${prod.category}</p>
                                <h2 style="font-size:2.5rem; margin-bottom:0.5rem; color:#111;">\${prod.name}</h2>
                                <div class="product-rating" style="justify-content: flex-start; margin-bottom: 1rem; font-size: 1.1rem; display: flex; gap: 0.2rem; align-items: center;">
                                    \${starsHtml}
                                    <span style="margin-left: 0.5rem;">(\${avgRating}) - \${numReviews} Reseñas</span>
                                </div>
                                \${oldPrice}
                                <p class="price" style="font-size:2rem; font-weight:bold; color:#111; margin-bottom:1.5rem;">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                                
                                \${variantsHTML}

                                <!-- Calculador de Envíos -->
                                <div style="background: #f9f9f9; padding: 1rem; border-radius: 8px; border: 1px solid #eaeaea; margin-bottom: 1.5rem;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-truck"></i> Calcula tu envío</h4>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="text" id="calc-zip" placeholder="Tu Código Postal" style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
                                        <button id="calc-btn" class="btn" style="padding: 0.5rem 1rem;">Calcular</button>
                                    </div>
                                    <p id="zip-msg" style="margin-top: 0.5rem; font-size: 0.85rem; color: #555; display: none;"></p>
                                </div>
                                
                                <p style="line-height:1.6; color:#555; margin-bottom:2rem;">\${prod.description}</p>
                                
                                <div style="display:flex; gap:1rem; align-items:center;">
                                    <button class="btn add-to-cart-btn" style="flex:1; padding:1rem; font-size:1.1rem; \${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}" \${isOutOfStock ? 'disabled' : ''}>
                                        <i class="fa-solid \${isOutOfStock ? 'fa-box-open' : 'fa-cart-plus'}"></i> \${isOutOfStock ? 'Sin Stock' : 'Añadir al carrito'}
                                    </button>
                                </div>

                                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                                    <ul style="list-style:none; padding:0; margin:0; font-size:0.9rem; color:#666;">
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-shield-halved" style="margin-right:10px; color:#2e8b57;"></i> 12 meses de garantía oficial</li>
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-rotate-left" style="margin-right:10px; color:#2e8b57;"></i> Devolución gratuita en 30 días</li>
                                        <li><i class="fa-solid fa-truck-fast" style="margin-right:10px; color:#000;"></i> <strong>Envío Inmediato</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN DE RESEÑAS -->
                        <div style="max-width: 1000px; margin: 4rem auto; padding: 2rem; background: #fff; border-radius: 12px; border: 1px solid #eee;">
                            <h3 style="font-size: 1.8rem; margin-bottom: 2rem; border-bottom: 2px solid #2e8b57; display: inline-block; padding-bottom: 0.5rem;">Reseñas de Clientes</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 3rem;">
                                <!-- Formulario de Reseña -->
                                <div>
                                    <h4 style="margin-bottom: 1rem;">Deja tu opinión</h4>
                                    <form id="review-form">
                                        <div style="margin-bottom: 1rem;">
                                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Calificación</label>
                                            <select id="review-rating" style="width: 100%; padding: 0.8rem; border-radius: 6px; border: 1px solid #ccc;">
                                                <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                                                <option value="4">⭐⭐⭐⭐ Muy Bueno</option>
                                                <option value="3">⭐⭐⭐ Bueno</option>
                                                <option value="2">⭐⭐ Regular</option>
                                                <option value="1">⭐ Malo</option>
                                            </select>
                                        </div>
                                        <div style="margin-bottom: 1rem;">
                                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Comentario</label>
                                            <textarea id="review-comment" rows="4" style="width: 100%; padding: 0.8rem; border-radius: 6px; border: 1px solid #ccc; resize: vertical;" placeholder="Cuéntanos tu experiencia con el producto..."></textarea>
                                        </div>
                                        <button type="submit" class="btn" style="width: 100%;">Publicar Reseña</button>
                                    </form>
                                    <p id="review-msg" style="margin-top: 1rem; font-size: 0.9rem; color: #2e8b57; display: none;"></p>
                                </div>

                                <!-- Lista de Reseñas -->
                                <div style="max-height: 400px; overflow-y: auto; padding-right: 1rem;">
                                    \${reviews.length === 0 ? '<p style="color: #666; font-style: italic;">Aún no hay reseñas. ¡Sé el primero en opinar!</p>' : ''}
                                    \${reviews.map(r => \`
                                        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee;">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                <strong style="color: #111;">\${r.user_name}</strong>
                                                <span style="color: #f1c40f; font-size: 0.9rem;">\${'⭐'.repeat(r.rating)}</span>
                                            </div>
                                            <p style="color: #555; margin: 0; font-size: 0.95rem; line-height: 1.5;">"\${r.comment}"</p>
                                            <small style="color: #aaa; display: block; margin-top: 0.5rem;">\${new Date(r.created_at).toLocaleDateString()}</small>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                \`;

                // Manejo de envío de reseña
                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                    reviewForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem('phoneSpotToken');
                        if (!token) {
                            alert('Debes iniciar sesión para dejar una reseña.');
                            window.location.href = 'login.html';
                            return;
                        }
                        
                        const rating = document.getElementById('review-rating').value;
                        const comment = document.getElementById('review-comment').value;
                        
                        try {
                            const res = await fetch('http://localhost:3000/api/reviews', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                                body: JSON.stringify({ product_id: prod.id, rating: Number(rating), comment })
                            });
                            
                            if (res.ok) {
                                document.getElementById('review-msg').innerText = '¡Gracias por tu reseña! Recarga la página para verla.';
                                document.getElementById('review-msg').style.display = 'block';
                                reviewForm.reset();
                            } else {
                                const data = await res.json();
                                alert('Error: ' + data.error);
                            }
                        } catch(err) {
                            alert('Error de conexión.');
                        }
                    });
                }

                if (hasVariants) {
                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const type = e.target.getAttribute('data-type');
                            document.querySelectorAll(\`[data-type="\${type}"]\`).forEach(el => el.classList.remove('active'));
                            e.target.classList.add('active');
                            e.target.style.background = '#111';
                            e.target.style.color = '#fff';
                            document.querySelectorAll(\`[data-type="\${type}"]:not(.active)\`).forEach(el => {
                                el.style.background = 'transparent';
                                el.style.color = '#111';
                            });
                            checkVariantStock(prod);
                        });
                    });
                    
                    // Inicializar estilos de botones active
                    document.querySelectorAll('.var-btn.active').forEach(el => {
                        el.style.background = '#111';
                        el.style.color = '#fff';
                    });
                    checkVariantStock(prod);
                }

                // Lógica Calculador Zip Code
                const calcBtn = document.getElementById('calc-btn');
                const calcZip = document.getElementById('calc-zip');
                const zipMsg = document.getElementById('zip-msg');
                if (calcBtn && calcZip && zipMsg) {
                    calcBtn.addEventListener('click', () => {
                        const zip = calcZip.value.trim();
                        if (!zip) return;
                        
                        zipMsg.style.display = 'block';
                        zipMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';
                        
                        setTimeout(() => {
                            let simulatedCost = 8500;
                            if (zip.startsWith('1') || zip.startsWith('2')) simulatedCost = 8500; // Buenos Aires
                            else if (zip.startsWith('5')) simulatedCost = 10500; // Córdoba
                            else simulatedCost = 13500; // Resto del país
                            
                            const freeThreshold = (window.phoneSpotSettings && window.phoneSpotSettings.free_shipping_threshold) || 1500000;
                            if (prod.price >= freeThreshold) {
                                zipMsg.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#2e8b57;"></i> ¡Envío GRATIS a tu código postal!';
                            } else {
                                zipMsg.innerHTML = \`<i class="fa-solid fa-truck"></i> Envío estimado: <strong>$\${simulatedCost.toLocaleString('es-AR')}</strong>\`;
                            }
                        }, 800);
                    });
                }

                loadRelatedProducts(prod.id, prod.category);
            })
            .catch(err => {
                singleProductContainer.innerHTML = '<p style="color:#ff4757; font-size:1.2rem;">Error al cargar el producto.</p>';
            });
        }
    }
`;

fs.writeFileSync('public/script.js', s1 + newLogic + s2, 'utf8');
