const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /const fullCatalogContainer = document\.getElementById\('full-catalog-container'\);[\s\S]*?(?=\/\/ Lógica para producto individual|\/\/ Lógica para|const singleProductContainer)/i;

const newLogic = `
    const fullCatalogContainer = document.getElementById('full-catalog-container');
    if (fullCatalogContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const initialCat = urlParams.get('cat') || 'all';

        let allCatalogProducts = [];
        let selectedBrands = initialCat !== 'all' && ['apple','samsung','motorola','xiaomi'].includes(initialCat) ? [initialCat] : [];
        let maxPriceFilter = 3000000;
        let onlyAmericanos = false;
        let currentSort = '';

        // UI Elements
        const priceRange = document.getElementById('price-range');
        const priceLabel = document.getElementById('price-label');
        const sortFilter = document.getElementById('sort-filter');
        const brandFiltersContainer = document.getElementById('brand-filters');
        const countLabel = document.getElementById('catalog-count-label');

        const renderFilteredCatalog = () => {
            if(!allCatalogProducts.length) return;

            let filtered = allCatalogProducts.filter(p => {
                // Category Filter (if initialCat was a category like 'celulares', not a brand)
                if (initialCat !== 'all' && !['apple','samsung','motorola','xiaomi'].includes(initialCat)) {
                    const str = (p.name + " " + p.description + " " + p.category).toLowerCase();
                    if (!str.includes(initialCat)) return false;
                }

                // Brand Filter
                if (selectedBrands.length > 0) {
                    const b = (p.brand || '').toLowerCase();
                    if (!selectedBrands.includes(b)) return false;
                }

                // Price Filter
                if (Number(p.price) > maxPriceFilter) return false;

                // Americanos Filter
                if (onlyAmericanos) {
                    const str = (p.name + " " + (p.description||'')).toLowerCase();
                    if (!str.includes('americano') && !str.includes('usa') && !str.includes('libre de f')) return false;
                }

                return true;
            });

            // Sort
            if (currentSort === 'price-asc') filtered.sort((a,b) => Number(a.price) - Number(b.price));
            if (currentSort === 'price-desc') filtered.sort((a,b) => Number(b.price) - Number(a.price));

            // Update UI count
            if (countLabel) {
                countLabel.innerText = 'Mostrando ' + filtered.length + ' producto' + (filtered.length === 1 ? '' : 's');
            }

            fullCatalogContainer.innerHTML = '';
            if (filtered.length === 0) {
                fullCatalogContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 1.2rem; margin-top: 2rem;">No se encontraron productos con estos filtros.</p>';
                return;
            }

            filtered.forEach(prod => {
                const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                const hasOffer = prod.old_price && Number(prod.old_price) > Number(prod.price);
                const discount = hasOffer ? Math.round((1 - (Number(prod.price)/Number(prod.old_price))) * 100) : 0;
                
                // Build Fav Icon
                const favs = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]');
                const isActive = favs.includes(prod.id.toString()) ? 'active' : '';
                const favIcon = \`<button class="fav-btn \${isActive}" data-id="\${prod.id}" onclick="toggleFavorite('\${prod.id}', event)" style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); border:none; width:35px; height:35px; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.1); cursor:pointer; color: \${isActive ? '#ff4757' : '#ccc'}; transition: 0.3s; z-index:10;"><i class="fa-solid fa-heart"></i></button>\`;

                const cardHTML = \`
                    <div class="product-card" data-id="\${prod.id}" style="position:relative; display:flex; flex-direction:column; background: var(--card-bg); border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s;">
                        \${hasOffer ? \`<span class="badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-\${discount}%</span>\` : ''}
                        
                        \${favIcon}

                        <a href="producto.html?id=\${prod.id}" style="display:block; height: 180px; margin-bottom: 1rem;">
                            <img src="\${image}" alt="\${prod.name}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s;">
                        </a>
                        <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.5rem;">\${prod.brand || 'PhoneSpot'}</p>
                        <h4 style="margin: 0 0 1rem; font-size: 1.1rem; flex:1;"><a href="producto.html?id=\${prod.id}" style="color: var(--text-color); text-decoration: none;">\${prod.name}</a></h4>
                        
                        <div style="margin-bottom: 1.5rem;">
                            \${hasOffer ? \`<p style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem; margin: 0;">$\${Number(prod.old_price).toLocaleString('es-AR')}</p>\` : ''}
                            <p style="color: var(--text-color); font-weight: 900; font-size: 1.4rem; margin: 0;">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                        </div>
                        
                        <button onclick="
                            const cart = JSON.parse(localStorage.getItem('phoneSpotCart') || '[]');
                            const existing = cart.find(i => i.id == '\${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '\${prod.id}', name: '\${prod.name}', price: \${prod.price}, image: '\${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " class="btn btn-block" style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#555555'">
                            <i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito
                        </button>
                    </div>
                \`;
                fullCatalogContainer.innerHTML += cardHTML;
            });
        };

        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(products => {
                allCatalogProducts = products;

                // Extract dynamic brands
                const availableBrands = [...new Set(products.map(p => (p.brand||'').trim()).filter(b => b))].sort();
                
                if (brandFiltersContainer) {
                    brandFiltersContainer.innerHTML = '';
                    availableBrands.forEach(b => {
                        const isChecked = selectedBrands.includes(b.toLowerCase()) ? 'checked' : '';
                        brandFiltersContainer.innerHTML += \`
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                                <input type="checkbox" value="\${b.toLowerCase()}" class="brand-checkbox" \${isChecked} style="accent-color: #555555; width: 18px; height: 18px;">
                                \${b}
                            </label>
                        \`;
                    });

                    // Add Americanos custom filter dynamically
                    const sideBarCondicion = document.getElementById('filters-sidebar');
                    if(sideBarCondicion && !document.getElementById('americano-filter')) {
                        const condContainer = document.createElement('div');
                        condContainer.innerHTML = \`
                            <div style="margin-bottom: 2rem; padding-bottom: 1rem;">
                                <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                                    Origen / Región <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                                </h3>
                                <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
                                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                                        <input type="checkbox" id="americano-filter" style="accent-color: #555555; width: 18px; height: 18px;">
                                        Equipos Americanos (iPhone)
                                    </label>
                                </div>
                            </div>
                        \`;
                        sideBarCondicion.appendChild(condContainer);
                        
                        document.getElementById('americano-filter').addEventListener('change', (e) => {
                            onlyAmericanos = e.target.checked;
                            renderFilteredCatalog();
                        });
                    }

                    // Attach Event Listeners to brand checkboxes
                    document.querySelectorAll('.brand-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedBrands.push(e.target.value);
                            else selectedBrands = selectedBrands.filter(b => b !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });
                }

                // Attach Event Listener to Price Slider
                if (priceRange) {
                    priceRange.addEventListener('input', (e) => {
                        maxPriceFilter = Number(e.target.value);
                        if (priceLabel) priceLabel.innerText = '$' + maxPriceFilter.toLocaleString('es-AR');
                        renderFilteredCatalog();
                    });
                }

                // Attach Event Listener to Sort
                if (sortFilter) {
                    sortFilter.addEventListener('change', (e) => {
                        currentSort = e.target.value;
                        renderFilteredCatalog();
                    });
                }

                renderFilteredCatalog();
            })
            .catch(err => {
                fullCatalogContainer.innerHTML = '<p>Error al cargar el catálogo.</p>';
            });
    }

`;

if (s.match(regex)) {
    s = s.replace(regex, newLogic);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Successfully replaced logic.');
} else {
    console.log('Regex failed.');
}
