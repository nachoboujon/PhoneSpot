window.initAdminCore = async () => {
    // Admin Panel - Crear Producto
    const adminForm = document.getElementById('admin-product-form');
    if (adminForm) {
        // Lógica de añadir variantes
        const btnAddVariant = document.getElementById('btn-add-variant');
        const variantsContainer = document.getElementById('variants-container');
        if (btnAddVariant && variantsContainer) {
            btnAddVariant.addEventListener('click', () => {
                const row = document.createElement('div');
                row.className = 'variant-row';
                row.style.cssText = 'display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;';
                row.innerHTML = `
                    <input type="text" class="var-color" placeholder="Color (Ej: Blanco o Único)" required style="flex:1; min-width:120px;">
                    <input type="text" class="var-cap" placeholder="Almacen. (Opcional)" style="flex:1; min-width:120px;">
                    <input type="text" class="var-configuration" placeholder="Configuración (CPU / pantalla)" aria-label="Configuración" style="flex:1; min-width:180px;">
                    <input type="text" class="var-ram" placeholder="RAM (Opc. Ej: 8GB)" style="flex:1; min-width:100px;">
                    <input type="text" class="var-batt" placeholder="Batería (Opc. Ej: 100%)" style="flex:1; min-width:110px;">
                    <input type="text" class="var-condition" placeholder="Condición / tipo (Opc.)" style="flex:1; min-width:130px;">
                    <input type="file" class="var-image" accept="image/*" title="Foto de esta variante" style="max-width:160px;">
                    <input type="number" class="var-price" placeholder="Precio" min="0" style="width:110px;" title="Deja vacío para precio base">
                    <input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">
                    <button type="button" class="btn-danger btn-remove-var" style="padding:0 0.8rem;"><i class="fa-solid fa-xmark"></i></button>
                `;
                variantsContainer.appendChild(row);

                row.querySelector('.btn-remove-var').addEventListener('click', () => row.remove());
            });

            const prodCategoryEl = document.getElementById('prod-category');
            if (prodCategoryEl) {
                prodCategoryEl.addEventListener('change', () => {
                    const isAccessory = prodCategoryEl.value === 'accesorios';
                    document.querySelectorAll('.var-cap').forEach(input => {
                        input.placeholder = isAccessory ? 'Almacen. (No aplica / Opcional)' : 'Almacen. (Opcional)';
                    });
                });
            }
        }

        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('phoneSpotToken');
            
            // Recopilar variantes y stock
            let totalStock = 0;
            const variantsArray = [];
            document.querySelectorAll('.variant-row').forEach(row => {
                const color = row.querySelector('.var-color').value.trim();
                const capacity = row.querySelector('.var-cap').value.trim();
                const ram = row.querySelector('.var-ram').value.trim();
                const configuration = row.querySelector('.var-configuration')?.value.trim() || '';
                const battEl = row.querySelector('.var-batt');
                const batt = battEl ? battEl.value.trim() : '';
                const variantCondition = row.querySelector('.var-condition')?.value.trim() || '';
                const priceEl = row.querySelector('.var-price');
                const price = priceEl && priceEl.value && Number(priceEl.value) > 0 ? parseFloat(priceEl.value) : null;
                const stock = parseInt(row.querySelector('.var-stock').value) || 0;
                if(color || capacity || stock > 0) {
                    variantsArray.push({
                        color: color || (capacity ? '' : 'Único'),
                        capacity: capacity || '',
                        ram,
                        batt,
                        condition: variantCondition,
                        configuration,
                        price,
                        stock
                    });
                    totalStock += stock;
                }
            });

            const formData = new FormData();
            formData.append('name', document.getElementById('prod-name').value);
            const baseDesc = document.getElementById('prod-desc').value;
            const conditionEl = document.getElementById('prod-condition');
            const condition = conditionEl ? conditionEl.value : 'Nuevo, Caja Sellada';
            
            // Si es Americano o Usado, lo agregamos a la descripción para que el buscador y el filtro lo detecten
            const finalDesc = condition !== 'Nuevo, Caja Sellada' ? `[Condición: ${condition}] ${baseDesc}` : baseDesc;
            formData.append('description', finalDesc);
            formData.append('price', document.getElementById('prod-price').value);
            formData.append('stock', totalStock); // El stock total es la suma de las variantes
            formData.append('brand', document.getElementById('prod-brand').value);
            formData.append('category', document.getElementById('prod-category').value);
            formData.append('is_offer', document.getElementById('prod-offer').value);
            formData.append('variants', JSON.stringify(variantsArray)); // Pasamos las variantes como JSON
            
            const fileInput = document.getElementById('prod-img');
            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]);
            }
            for (const file of document.getElementById('prod-images')?.files || []) {
                formData.append('images', file);
            }

            showToast('Subiendo a la tienda...', 'fa-spinner fa-spin');
            try {
                const res = await fetch(window.API_URL + '/api/products', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // No poner 'Content-Type': 'application/json' porque fetch lo pone solo para FormData
                    },
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    const rows = [...document.querySelectorAll('.variant-row')];
                    for (const [index, row] of rows.entries()) {
                        const file = row.querySelector('.var-image')?.files?.[0];
                        if (!file) continue;
                        const imageBody = new FormData();
                        imageBody.append('image', file);
                        const imageResponse = await fetch(`${window.API_URL}/api/products/${data.productId}/variants/${index}/image`, {
                            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: imageBody
                        });
                        if (!imageResponse.ok) throw new Error('El producto se creó, pero una foto de variante no se pudo subir.');
                    }
                    showToast('¡Producto subido y visible en la tienda!', 'fa-check');
                    adminForm.reset();
                    if(typeof loadAdminProducts === 'function') loadAdminProducts();
                } else {
                    showToast(data.error || 'Error al subir', 'fa-triangle-exclamation');
                }
            } catch (err) { showToast(err.message || 'Error de conexión', 'fa-triangle-exclamation'); }
        });

        // ==================== LISTAR Y GESTIONAR PRODUCTOS EN ADMIN ====================
        const productListContainer = document.getElementById('admin-product-list');
        if (productListContainer) {
            window.loadAdminProducts = async () => {
                try {
                    const res = await fetch(window.API_URL + '/api/products?images=original');
                    const prods = await res.json();
                    productListContainer.innerHTML = '';
                    if(prods.length === 0) {
                        productListContainer.innerHTML = '<p>No hay productos subidos.</p>';
                        return;
                    }

                    
                    const productMarkup = [];
                    prods.forEach(p => {
                        window[`adminProduct_${p.id}`] = p; // save product data globally for easy access
                        productMarkup.push(`
                            <div class="slide-item" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                    <div style="flex:2;">
                                        <h5 style="margin:0;">${p.name}</h5>
                                        <p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: ${p.category} | Marca: ${p.brand}</p>
                                        <textarea id="desc-${p.id}" rows="2" style="width:100%; margin-top:0.5rem; font-size:0.8rem; padding:0.3rem;" placeholder="Descripción">${p.description || ''}</textarea>
                                    </div>
                                    <div class="admin-product-actions" style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <label for="price-${p.id}" style="font-size:0.8rem;">Precio (USD):</label>
                                        <input type="number" id="price-${p.id}" value="${p.price}" style="width:80px; padding:0.2rem;">
                                        
                                        <label for="stock-${p.id}" style="font-size:0.8rem;">Stock:</label>
                                        <input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px; padding:0.2rem;" ${(p.variants && p.variants.length > 0) ? 'disabled title="El stock se edita desde Variantes/Colores" style="background:#eee; width:70px; padding:0.2rem;"' : ''}>
                                        
                                        <button onclick="updateProductBasic(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Info</button>
                                        <button onclick="toggleVariantsEdit(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:var(--text-color);">Variantes/Colores</button>
                                        <label style="font-size:0.8rem;">Más fotos <input type="file" id="more-images-${p.id}" accept="image/*" multiple style="max-width:150px;"></label>
                                        <button onclick="uploadProductImages(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem;">Subir fotos</button>
                                        <button onclick="deleteProduct(${p.id})" class="btn-danger" aria-label="Eliminar producto" title="Eliminar producto" style="padding:0.3rem 0.5rem;"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
                                    </div>
                                </div>
                                <div class="admin-offer-controls">
                                    <span class="admin-offer-state">${p.is_offer ? 'Publicado en Ofertas del Día' : 'No está en oferta'}</span>
                                    <button type="button" class="admin-offer-button" aria-pressed="${Boolean(p.is_offer)}" onclick="toggleProductOffer(this, ${p.id})">${p.is_offer ? 'Quitar oferta' : 'Poner en oferta'}</button>
                                    <span class="admin-offer-status" role="status" aria-live="polite"></span>
                                </div>
                                <div id="variants-edit-${p.id}" style="display:none; padding:1rem; background:var(--bg-color); border-radius:8px; border:1px dashed var(--border-color);">
                                    <h6 style="margin-bottom:0.5rem;">Variantes (Colores/Capacidad)</h6>
                                    <div id="variants-list-${p.id}" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;"></div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <input type="text" id="new-color-${p.id}" placeholder="Color (ej. Azul o Único)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-cap-${p.id}" placeholder="Capacidad (Opcional)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-configuration-${p.id}" placeholder="Configuración (CPU / pantalla)" aria-label="Configuración" style="padding:0.2rem; width:200px;">
                                        <input type="text" id="new-ram-${p.id}" placeholder="RAM (ej. 8GB)" style="padding:0.2rem; width:80px;">
                                        <input type="text" id="new-batt-${p.id}" placeholder="Batería (Opc)" style="padding:0.2rem; width:90px;">
                                        <input type="text" id="new-condition-${p.id}" placeholder="Condición (Opc)" style="padding:0.2rem; width:130px;">
                                        <input type="number" id="new-vprice-${p.id}" placeholder="Precio USD (Opc)" style="padding:0.2rem; width:110px;">
                                        <input type="number" id="new-vstock-${p.id}" placeholder="Stock" style="padding:0.2rem; width:70px;">
                                        <button onclick="addVariantToProduct(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#2ecc71; color:#fff;">+ Agregar Variante</button>
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                    productListContainer.innerHTML = productMarkup.join('');

                } catch(e) { productListContainer.innerHTML = 'Error cargando productos'; }
            };

            
            window.updateProductBasic = async (id) => {
                const p = window[`adminProduct_${id}`];
                const price = document.getElementById(`price-${id}`).value;
                let stock = document.getElementById(`stock-${id}`).value;
                const description = document.getElementById(`desc-${id}`) ? document.getElementById(`desc-${id}`).value : undefined;
                
                let hasVariants = p && p.variants && p.variants.length > 0;
                
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const bodyData = { price, description };
                    if (!hasVariants) {
                        bodyData.stock = stock;
                    }
                    
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(bodyData)
                    });
                    
                    if (res.ok) {
                        showToast('Datos actualizados', 'fa-check');
                        window.loadAdminProducts();
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };

            window.toggleVariantsEdit = (id) => {
                const div = document.getElementById(`variants-edit-${id}`);
                const isHidden = div.style.display === 'none';
                div.style.display = isHidden ? 'block' : 'none';
                if (isHidden) renderProductVariants(id);
            };

            window.renderProductVariants = (id) => {
                const p = window[`adminProduct_${id}`];
                const list = document.getElementById(`variants-list-${id}`);
                if (!p || !list) return;
                
                let variants = [];
                try { variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants; } catch(e){}
                if (!variants || !Array.isArray(variants)) variants = [];
                
                window[`adminProductVariants_${id}`] = variants; // keep track of parsed variants

                list.innerHTML = variants.map((v, index) => {
                    const variantDesc = window.variantNameFor(v) || 'Variante';
                    return `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f5f7; padding:0.5rem; border-radius:4px; flex-wrap:wrap; gap:0.5rem;">
                        <span style="font-size:0.85rem;">${variantDesc} ${v.price ? ' - <strong style="color:#0071e3">US$ ' + v.price + '</strong>' : ''}</span>
                        <label style="font-size:0.8rem;">Foto <input type="file" id="variant-image-${id}-${index}" accept="image/*" style="max-width:150px;"></label>
                        <button onclick="uploadVariantImage(${id}, ${index})" class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem;">Subir</button>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <label for="edit-vprice-${id}-${index}" style="font-size:0.8rem; margin:0;">Precio USD:</label>
                            <input type="number" id="edit-vprice-${id}-${index}" value="${v.price ?? ''}" min="0.01" step="0.01" placeholder="Precio base" style="width:100px; padding:0.35rem; font-size:0.8rem;" title="Dejá vacío para usar el precio base">
                            <label for="edit-vstock-${id}-${index}" style="font-size:0.8rem; margin:0;">Stock:</label>
                            <input type="number" id="edit-vstock-${id}-${index}" value="${v.stock}" min="0" step="1" style="width:65px; padding:0.35rem; font-size:0.8rem;">
                            <button type="button" onclick="updateVariantDetails(${id}, ${index})" style="background:#333; color:white; border:none; border-radius:4px; padding:0.45rem 0.7rem; font-size:0.8rem; cursor:pointer;">Guardar precio y stock</button>
                            <button onclick="removeVariantFromProduct(${id}, ${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; margin-left:0.5rem;"><i class="fa-solid fa-times"></i></button>
                        </div>
                    </div>
                `;
                }).join('');
            };

            window.addVariantToProduct = async (id) => {
                const color = document.getElementById(`new-color-${id}`).value.trim();
                const cap = document.getElementById(`new-cap-${id}`).value.trim();
                const ram = document.getElementById(`new-ram-${id}`).value.trim();
                const configuration = document.getElementById(`new-configuration-${id}`)?.value.trim() || '';
                const battEl = document.getElementById(`new-batt-${id}`);
                const batt = battEl ? battEl.value.trim() : '';
                const condition = document.getElementById(`new-condition-${id}`)?.value.trim() || '';
                const stock = parseInt(document.getElementById(`new-vstock-${id}`).value) || 0;
                const rawPrice = document.getElementById(`new-vprice-${id}`).value;
                const price = rawPrice && Number(rawPrice) > 0 ? parseFloat(rawPrice) : null;
                
                if (!color && !cap) return showToast('Ingresa al menos un Color o Capacidad', 'fa-exclamation');

                let variants = window[`adminProductVariants_${id}`] || [];
                variants.push({ color: color || 'Único', capacity: cap || '', ram, batt, condition, configuration, stock, price });
                
                await saveVariantsToDB(id, variants);
            };

            window.updateVariantDetails = async (id, index) => {
                const variants = (window[`adminProductVariants_${id}`] || []).map(variant => ({ ...variant }));
                if (!variants[index]) return;
                const rawPrice = document.getElementById(`edit-vprice-${id}-${index}`).value.trim();
                const rawStock = document.getElementById(`edit-vstock-${id}-${index}`).value.trim();
                const price = rawPrice === '' ? null : Number(rawPrice);
                const stock = Number(rawStock);
                if (rawPrice !== '' && (!Number.isFinite(price) || price <= 0)) return showToast('Ingresá un precio USD mayor a cero o dejalo vacío para usar el precio base.', 'fa-triangle-exclamation');
                if (rawStock === '' || !Number.isInteger(stock) || stock < 0) return showToast('Ingresá un stock válido.', 'fa-triangle-exclamation');
                variants[index].price = price;
                variants[index].stock = stock;
                await saveVariantsToDB(id, variants);
            };

            window.removeVariantFromProduct = async (id, index) => {
                let variants = window[`adminProductVariants_${id}`] || [];
                variants.splice(index, 1);
                await saveVariantsToDB(id, variants);
            };

            const saveVariantsToDB = async (id, variants) => {
                const token = localStorage.getItem('phoneSpotToken');
                const totalStock = variants.reduce((acc, v) => acc + (parseInt(v.stock)||0), 0);
                
                showToast('Actualizando variantes...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ variants, stock: totalStock })
                    });
                    if(res.ok) {
                        showToast('Variantes actualizadas', 'fa-check');
                        window.loadAdminProducts(); // re-fetch products
                    } else {
                        const result = await res.json().catch(() => ({}));
                        showToast(result.error || 'No se pudieron guardar las variantes.', 'fa-times');
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };

            window.uploadProductImages = async (id) => {
                const files = document.getElementById(`more-images-${id}`)?.files;
                if (!files?.length) return showToast('Selecciona fotos', 'fa-image');
                const body = new FormData();
                for (const file of files) body.append('images', file);
                try {
                    const response = await fetch(`${window.API_URL}/api/products/${id}/images`, {
                        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('phoneSpotToken')}` }, body
                    });
                    if (!response.ok) throw new Error((await response.json()).error || 'No se pudieron subir las fotos');
                    showToast('Fotos agregadas', 'fa-check');
                    window.loadAdminProducts();
                } catch (error) { showToast(error.message, 'fa-triangle-exclamation'); }
            };

            window.uploadVariantImage = async (id, index) => {
                const file = document.getElementById(`variant-image-${id}-${index}`)?.files?.[0];
                if (!file) return showToast('Selecciona una foto', 'fa-image');
                const body = new FormData();
                body.append('image', file);
                try {
                    const response = await fetch(`${window.API_URL}/api/products/${id}/variants/${index}/image`, {
                        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('phoneSpotToken')}` }, body
                    });
                    if (!response.ok) throw new Error((await response.json()).error || 'No se pudo subir la foto');
                    showToast('Foto de variante actualizada', 'fa-check');
                    window.loadAdminProducts();
                } catch (error) { showToast(error.message, 'fa-triangle-exclamation'); }
            };

            window.deleteProduct = async (id) => {
                if(!confirm('¿Querés quitar este producto del catálogo?')) return;
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if(res.ok) {
                        showToast('Producto eliminado', 'fa-check');
                        window.loadAdminProducts();
                    } else {
                        if (res.status === 401 || res.status === 403) {
                            localStorage.removeItem('phoneSpotToken');
                            localStorage.removeItem('phoneSpotRole');
                            window.location.href = 'login.html?redirect=admin.html&reason=session-expired';
                            return;
                        }
                        const result = await res.json().catch(() => ({}));
                        showToast(result.error || 'Error eliminando producto', 'fa-triangle-exclamation');
                    }
                } catch(e) { showToast('No se pudo conectar con el servidor', 'fa-triangle-exclamation'); }
            };

            window.loadAdminProducts();
        }

        // ==================== LISTAR ÓRDENES ====================
        const ordersListContainer = document.getElementById('admin-orders-list');
        if (ordersListContainer) {
            window.updateOrderStatus = async (id) => {
              const status = document.getElementById('status-'+id).value;
              const tracking = document.getElementById('tracking-'+id).value;
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch(window.API_URL + '/api/orders/'+id+'/status', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                      body: JSON.stringify({ status, tracking_code: tracking })
                  });
                  if(res.ok) {
                      alert('Orden actualizada correctamente.');
                  } else {
                      alert('Error al actualizar.');
                  }
              } catch(e) { alert(e.message); }
          };

          window.loadAdminOrders = async () => {
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch(window.API_URL + '/api/orders', {
                      headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const orders = await res.json();
                  
                  let totalRevenue = 0;
                  let totalItems = 0;
                  const productSales = {};

                  ordersListContainer.innerHTML = '';
                  if(!orders || orders.length === 0) {
                      ordersListContainer.innerHTML = '<p>No hay ventas registradas aún.</p>';
                      return;
                  }

                  orders.forEach(o => {
                      totalRevenue += parseFloat(o.total) || 0;
                      
                      let itemsHTML = '';
                      if (o.order_items && o.order_items.length > 0) {
                          itemsHTML = o.order_items.map(item => {
                              const varText = item.variant_name ? ` <strong>(${item.variant_name})</strong>` : '';
                              const prodName = item.products ? item.products.name : 'Producto Eliminado';
                              totalItems += item.quantity;
                              if (!productSales[prodName]) {
                                  productSales[prodName] = 0;
                              }
                              productSales[prodName] += item.quantity;
                              return `<li>${item.quantity}x ${prodName}${varText} - $${item.price}</li>`;
                          }).join('');
                      }

                      ordersListContainer.innerHTML += `
                          <div class="slide-item" style="display:flex; flex-direction:column; gap:0.5rem;">
                              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                  <div style="flex:2;">
                                      <h5 style="margin:0;">Orden #${String(o.id)} <span style="color:#555555;">($${o.total})</span></h5>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-calendar"></i> ${new Date(o.created_at).toLocaleString()}</p>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-user"></i> ${escapeText(o.customer_name || 'Cliente')} · ${escapeText(o.customer_email || 'Sin email')}</p>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> Envío: ${o.shipping_address}</p>
                                  </div>
                                  <div style="flex:2; display:flex; gap:1rem; align-items:center; background: var(--gray-bg); padding:0.5rem; border-radius:8px;">
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Estado:</label>
                                          <select id="status-${o.id}" style="padding:0.2rem; border-radius:4px;">
                                              <option value="pending" ${o.status==='pending'?'selected':''}>Pendiente</option>
                                              <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmado</option>
                                              <option value="preparing" ${o.status==='preparing'?'selected':''}>En preparación</option>
                                              <option value="completed" ${o.status==='completed'?'selected':''}>Pago confirmado</option>
                                              <option value="shipped" ${o.status==='shipped'?'selected':''}>Enviado</option>
                                              <option value="delivered" ${o.status==='delivered'?'selected':''}>Entregado</option>
                                              <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelado</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Tracking:</label>
                                          <input type="text" id="tracking-${o.id}" value="${o.tracking_code || ''}" placeholder="Cód. Correo" style="width:100px; padding:0.2rem; border-radius:4px; border: 1px solid var(--border-color);">
                                      </div>
                                      <button onclick="updateOrderStatus('${o.id}')" class="btn" style="padding:0.4rem 0.6rem; font-size:0.8rem; height:fit-content; background:#3498db; margin-top:1rem;">Guardar</button>
                                  </div>
                              </div>
                              <ul style="margin:0; padding-left:1.5rem; font-size:0.85rem; color: var(--text-muted);">
                                  ${itemsHTML}
                              </ul>
                          </div>
                      `;
                  });

                  const totalRevEl = document.getElementById('stat-total-revenue');
                  const totalVenEl = document.getElementById('stat-total-orders');
                  const totalItemsEl = document.getElementById('stat-total-items');
                  const topProdEl = document.getElementById('top-products-list');

                  if(totalRevEl) totalRevEl.innerText = '$' + totalRevenue.toLocaleString('es-AR');
                  if(totalVenEl) totalVenEl.innerText = orders.length;
                  if(totalItemsEl) totalItemsEl.innerText = totalItems;
                  
                  if(topProdEl && Object.keys(productSales).length > 0) {
                      const topProduct = Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b);
                      topProdEl.innerHTML = `<strong>${escapeText(topProduct)}</strong> · ${productSales[topProduct]} unidades`;
                  }

              } catch(e) {
                  console.error(e);
              }
          };
          window.loadAdminOrders();
        }

        const reviewsAdminContainer = document.getElementById('admin-reviews-list');
        if (reviewsAdminContainer) {
            window.loadAdminReviews = async () => {
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const response = await fetch(window.API_URL + '/api/admin/reviews', { headers: { 'Authorization': `Bearer ${token}` } });
                    const reviews = await response.json();
                    if (!response.ok) throw new Error(reviews.error || 'No se pudieron cargar las reseñas.');
                    reviewsAdminContainer.innerHTML = reviews.length ? reviews.map((review) => `
                        <article class="slide-item" style="display:flex;flex-direction:column;gap:.45rem;">
                            <strong>${escapeText(review.products?.name || 'Producto eliminado')} · ${'★'.repeat(review.rating)}</strong>
                            <span>${escapeText(review.user_name)}: ${escapeText(review.comment)}</span>
                            <small style="color:var(--text-muted)">${review.approved ? 'Publicada' : 'Pendiente de publicación'}</small>
                            <button class="btn" style="align-self:flex-start;padding:.45rem .7rem;" onclick="setReviewApproval(${Number(review.id)}, ${!review.approved})">${review.approved ? 'Ocultar' : 'Publicar'}</button>
                        </article>`).join('') : '<p>No hay reseñas todavía.</p>';
                } catch (error) {
                    reviewsAdminContainer.innerHTML = `<p style="color:#c0392b;">${escapeText(error.message)}</p>`;
                }
            };
            window.setReviewApproval = async (id, approved) => {
                const token = localStorage.getItem('phoneSpotToken');
                const response = await fetch(window.API_URL + `/api/admin/reviews/${id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ approved })
                });
                const result = await response.json();
                if (!response.ok) return showToast(result.error || 'No se pudo actualizar la reseña.', 'fa-triangle-exclamation');
                showToast(result.message, 'fa-check');
                window.loadAdminReviews();
            };
            window.loadAdminReviews();
        }

        const analyticsSummary = document.getElementById('analytics-summary');
        if (analyticsSummary) {
            fetch(window.API_URL + '/api/admin/analytics', { headers: { ...(localStorage.getItem('phoneSpotToken') ? {'Authorization': `Bearer ${localStorage.getItem('phoneSpotToken')}`} : {}) } })
                .then(response => response.json().then(data => ({ response, data })))
                .then(({ response, data }) => {
                    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las métricas.');
                    analyticsSummary.textContent = `${data.page_views} visitas · ${data.add_to_cart} agregados al carrito · ${data.checkout_started} inicios de compra · ${data.orders_created || 0} pedidos registrados · ${data.orders_confirmed || 0} confirmados · USD ${Number(data.revenue_usd || 0).toLocaleString('es-AR')} en pedidos confirmados · ${data.contacts || 0} contactos · ${data.searches_empty || 0} búsquedas sin resultados.`;
                    for(const device of ['mobile','desktop']) {const stats=data.performance?.[device];if(!stats) continue; const values=['LCP','INP','CLS'].filter(metric=>stats[metric]?.p75!=null).map(metric=>metric+': '+Number(stats[metric].p75).toFixed(metric==='CLS'?3:0));if(values.length) analyticsSummary.append(document.createElement('br'),document.createTextNode((device==='mobile'?'Celular':'Escritorio')+' · percentil 75: '+values.join(' · ')));}
                })
                .catch(() => { analyticsSummary.textContent = 'Las métricas se mostrarán cuando haya actividad nueva.'; });
        }

        const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('phoneSpotToken');
            localStorage.removeItem('phoneSpotRole');
            window.location.href = 'index.html';
        });


        // ==================== CONFIGURACIÓN VISUAL DEL ADMIN (Banners y Carrusel) ====================
        const defaultEcosystemBanner = {
            enabled: true,
            title: 'Armá tu ecosistema',
            description: 'Accesorios que acompañan tu equipo: auriculares, cargadores, fundas y mucho más.',
            button: 'Ver accesorios',
            link: 'catalogo.html?cat=accesorios',
            image: ''
        };
        let currentSettings = { top_banner: '', carousel: [], shipping_correo: 8500, shipping_andreani: 12000, free_shipping_threshold: 1500000, ecosystem_banner: defaultEcosystemBanner };
            window.renderBannerMessages = () => {
                const list = document.getElementById('banner-messages-list');
                if(!list) return;
                let banners = currentSettings.top_banner;
                if (!Array.isArray(banners)) {
                    banners = typeof banners === 'string' && banners.trim() !== '' ? [banners] : [];
                    currentSettings.top_banner = banners;
                }
                list.innerHTML = banners.map((b, i) => `
                    <div style="display:flex; gap:10px;">
                        <input type="text" value="${b.replace(/"/g, '&quot;')}" onchange="updateBannerMessage(${i}, this.value)" style="flex:1;">
                        <button type="button" onclick="removeBannerMessage(${i})" style="background:#ff4757; color:white; border:none; padding:0 15px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join('');
            };
            window.addBannerMessage = () => {
                if(!Array.isArray(currentSettings.top_banner)) currentSettings.top_banner = [];
                currentSettings.top_banner.push('');
                window.renderBannerMessages();
            };
            window.updateBannerMessage = (i, val) => {
                currentSettings.top_banner[i] = val;
            };
            window.removeBannerMessage = async (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
                await window.saveSettingsFunc(); // auto save
            };


        
    const waForm = document.getElementById('admin-whatsapp-form');
    if (waForm) {
        waForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentSettings.whatsapp_number = document.getElementById('set-whatsapp-num').value.replace(/[^0-9]/g, '');
            await window.saveSettingsFunc();
            showToast('Número de WhatsApp guardado', 'fa-check');
        });
    }

    const couponForm = document.getElementById('admin-coupon-form');
    if (couponForm) {
        window.renderAdminCoupons = () => {
            const list = document.getElementById('coupons-list');
            if (!list) return;
            const coupons = currentSettings.coupons || [];
            list.innerHTML = coupons.map((c, i) => `
                <div style="background: var(--gray-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.5rem;">
                    <strong>${c.code}</strong> 
                    <span style="font-size: 0.8rem; color: var(--text-muted);">(${c.type === 'shipping' ? 'Envío' : c.value})</span>
                    <i class="fa-solid fa-times" style="cursor: pointer; color: #ff4757;" onclick="deleteCoupon(${i})"></i>
                </div>
            `).join('');
        };

        window.deleteCoupon = async (index) => {
            currentSettings.coupons.splice(index, 1);
            await window.saveSettingsFunc();
            window.renderAdminCoupons();
        };

        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentSettings.coupons) currentSettings.coupons = [];
            currentSettings.coupons.push({
                code: document.getElementById('add-coupon-code').value.trim().toUpperCase(),
                type: document.getElementById('add-coupon-type').value,
                value: Number(document.getElementById('add-coupon-value').value)
            });
            await window.saveSettingsFunc();
            couponForm.reset();
            window.renderAdminCoupons();
            showToast('Cupón agregado', 'fa-check');
        });
    }

    const bannerForm = document.getElementById('admin-banner-form');
        const carouselForm = document.getElementById('admin-carousel-form');
        const shippingForm = document.getElementById('admin-shipping-form');
        const ecosystemForm = document.getElementById('admin-ecosystem-form');
        
        if (bannerForm || carouselForm || shippingForm || ecosystemForm) {
            // Cargar datos actuales
            const loadAdminSettings = async () => {
                try {
                    const res = await fetch(window.API_URL + '/api/settings');
                    const data = await res.json();
                    currentSettings = { ...currentSettings, ...data };
                    currentSettings.ecosystem_banner = { ...defaultEcosystemBanner, ...(currentSettings.ecosystem_banner || {}) };
                    
                    window.renderBannerMessages();
                    if(document.getElementById('set-flash-date')) {
                        document.getElementById('set-flash-date').value = currentSettings.flash_end_date || '';
                    }
                    if(document.getElementById('set-brands-list')) {
                        document.getElementById('set-brands-list').value = currentSettings.brands_list || '';
                    }
                    if(document.getElementById('set-ship-correo')) {
                        document.getElementById('set-ship-correo').value = currentSettings.shipping_correo ?? 8500;
                    }
                    if(document.getElementById('set-ship-andreani')) {
                        document.getElementById('set-ship-andreani').value = currentSettings.shipping_andreani ?? 12000;
                    }
                    if(document.getElementById('set-free-shipping')) {
                        document.getElementById('set-free-shipping').value = currentSettings.free_shipping_threshold ?? 1500000;

    const waInput = document.getElementById('set-whatsapp-num');
    if (waInput && currentSettings.whatsapp_number) waInput.value = currentSettings.whatsapp_number;
    window.renderAdminCoupons();

                    }
                    if (document.getElementById('set-eco-enabled')) {
                        const ecosystem = currentSettings.ecosystem_banner;
                        document.getElementById('set-eco-enabled').checked = ecosystem.enabled !== false;
                        document.getElementById('set-eco-title').value = ecosystem.title;
                        document.getElementById('set-eco-description').value = ecosystem.description;
                        document.getElementById('set-eco-button').value = ecosystem.button;
                        document.getElementById('set-eco-link').value = ecosystem.link;
                    }
                    renderAdminCarouselList();
                } catch(e) { console.error('Error', e); }
            };

            window.saveSettingsFunc = async () => {
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(window.API_URL + '/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(currentSettings)
                    });
                    if (res.ok) showToast('Guardado correctamente', 'fa-check');
                    else showToast('Error al guardar', 'fa-triangle-exclamation');
                } catch(e) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
            };
            const saveSettings = async () => { await window.saveSettingsFunc(); };

            const renderAdminCarouselList = () => {
                const list = document.getElementById('carousel-list');
                if(!list) return;
                list.innerHTML = '';
                if(!currentSettings.carousel || currentSettings.carousel.length === 0) {
                    list.innerHTML = '<p style="color: var(--text-muted);">No hay slides en el carrusel.</p>';
                    return;
                }
                
                currentSettings.carousel.forEach((slide, index) => {
                    list.innerHTML += `
                        <div class="slide-item">
                            <div class="slide-info">
                                <h5>${slide.title}</h5>
                                <p>${slide.subtitle} | Link: ${slide.link}</p>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button type="button" class="btn" style="background:#0071e3; color:white; padding:0.4rem;" onclick="window.editSlide(${index})"><i class="fa-solid fa-pen"></i></button>
                                <button type="button" class="btn-danger" onclick="deleteSlide(${index})"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                });
            };

            window.deleteSlide = (index) => {
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
            };

            if(bannerForm) {
                bannerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    // Extraer los mensajes del banner en el momento del submit para evitar bugs de onchange
                    const listContainer = document.getElementById('banner-messages-list');
                    if (listContainer) {
                        const inputs = listContainer.querySelectorAll('input[type="text"]');
                        currentSettings.top_banner = Array.from(inputs).map(inp => inp.value);
                    }

                    if(document.getElementById('set-flash-date')) {
                        currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                    }
                    if(document.getElementById('set-brands-list')) {
                        currentSettings.brands_list = document.getElementById('set-brands-list').value;
                    }
                    window.saveSettingsFunc();
                });
            }

            if(shippingForm) {
                shippingForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    currentSettings.shipping_correo = Number(document.getElementById('set-ship-correo').value);
                    currentSettings.shipping_andreani = Number(document.getElementById('set-ship-andreani').value);
                    currentSettings.free_shipping_threshold = Number(document.getElementById('set-free-shipping').value);
                    saveSettings();
                });
            }

            if(carouselForm) {
                
                carouselForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const title = document.getElementById('set-car-title').value.trim();
                    const subtitle = document.getElementById('set-car-subtitle').value.trim();
                    const link = document.getElementById('set-car-link').value.trim();
                    
                    const fileInput = document.getElementById('set-car-img');
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
                    }
                });
    
            }

            if (ecosystemForm) {
                ecosystemForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const submitButton = ecosystemForm.querySelector('button[type="submit"]');
                    const originalButton = submitButton.innerHTML;
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

                    try {
                        const previous = { ...defaultEcosystemBanner, ...(currentSettings.ecosystem_banner || {}) };
                        const imageInput = document.getElementById('set-eco-image');
                        let image = previous.image || '';

                        if (imageInput.files.length > 0) {
                            const formData = new FormData();
                            formData.append('image', imageInput.files[0]);
                            const response = await fetch(window.API_URL + '/api/upload', {
                                method: 'POST',
                                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('phoneSpotToken') },
                                body: formData
                            });
                            const upload = await response.json();
                            if (!upload.url) throw new Error('No se pudo subir la imagen');
                            image = upload.url;
                        }

                        currentSettings.ecosystem_banner = {
                            enabled: document.getElementById('set-eco-enabled').checked,
                            title: document.getElementById('set-eco-title').value.trim(),
                            description: document.getElementById('set-eco-description').value.trim(),
                            button: document.getElementById('set-eco-button').value.trim(),
                            link: document.getElementById('set-eco-link').value.trim(),
                            image
                        };
                        await saveSettings();
                        imageInput.value = '';
                    } catch (error) {
                        console.error('Error guardando banner de accesorios:', error);
                        showToast('No se pudo guardar el banner', 'fa-triangle-exclamation');
                    } finally {
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButton;
                    }
                });
            }

            loadAdminSettings();
        }
    }
};
