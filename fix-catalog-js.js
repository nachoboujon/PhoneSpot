const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const targetScript = `
        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(products => {
                fullCatalogContainer.innerHTML = '';
                const filtered = products.filter(p => {
                    if (cat === 'all') return true;
                    const searchStr = (p.name + " " + p.description + " " + p.brand).toLowerCase();
                    if (cat === 'celulares') return p.category === 'celulares' || searchStr.includes('iphone') || searchStr.includes('galaxy') || searchStr.includes('celular') || searchStr.includes('phone') || searchStr.includes('moto') || searchStr.includes('xiaomi');
                    if (cat === 'notebooks') return p.category === 'notebooks' || searchStr.includes('notebook') || searchStr.includes('laptop') || searchStr.includes('macbook');
                    if (cat === 'tablets') return p.category === 'tablets' || searchStr.includes('tablet') || searchStr.includes('ipad');
                    if (cat === 'accesorios') return p.category === 'accesorios' || searchStr.includes('funda') || searchStr.includes('cargador') || searchStr.includes('auricular') || searchStr.includes('airpod');
                    // Búsqueda por marca exacta (Apple, Samsung, etc)
                    if (p.brand && p.brand.toLowerCase().trim() === cat.toLowerCase().trim()) return true;
                    return false;
                });`;

const newScript = `
        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(products => {
                let baseFiltered = products.filter(p => {
                    if (cat === 'all') return true;
                    const searchStr = (p.name + " " + p.description + " " + (p.brand||'')).toLowerCase();
                    if (cat === 'celulares') return p.category === 'celulares' || searchStr.includes('iphone') || searchStr.includes('galaxy') || searchStr.includes('celular') || searchStr.includes('phone') || searchStr.includes('moto') || searchStr.includes('xiaomi');
                    if (cat === 'notebooks') return p.category === 'notebooks' || searchStr.includes('notebook') || searchStr.includes('laptop') || searchStr.includes('macbook');
                    if (cat === 'tablets') return p.category === 'tablets' || searchStr.includes('tablet') || searchStr.includes('ipad');
                    if (cat === 'accesorios') return p.category === 'accesorios' || searchStr.includes('funda') || searchStr.includes('cargador') || searchStr.includes('auricular') || searchStr.includes('airpod');
                    if (p.brand && p.brand.toLowerCase().trim() === cat.toLowerCase().trim()) return true;
                    return false;
                });
                
                // Extraer marcas únicas
                const brands = [...new Set(baseFiltered.map(p => p.brand).filter(Boolean))];
                const brandFiltersDiv = document.getElementById('brand-filters');
                if (brandFiltersDiv && brands.length > 0) {
                    brandFiltersDiv.innerHTML = brands.map(b => \`<label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" class="brand-cb" value="\${b}"> \${b}</label>\`).join('');
                } else if (brandFiltersDiv) {
                    brandFiltersDiv.innerHTML = '<span style="color:#888; font-size:0.9rem;">No hay marcas específicas</span>';
                }

                const priceRange = document.getElementById('price-range');
                const priceLabel = document.getElementById('price-label');
                const sortFilter = document.getElementById('sort-filter');

                function renderCatalog() {
                    fullCatalogContainer.innerHTML = '';
                    let filtered = [...baseFiltered];

                    // Filtrar por precio
                    if (priceRange) {
                        const maxPrice = Number(priceRange.value);
                        filtered = filtered.filter(p => Number(p.price) <= maxPrice);
                    }

                    // Filtrar por marcas
                    const checkedBrands = Array.from(document.querySelectorAll('.brand-cb:checked')).map(cb => cb.value);
                    if (checkedBrands.length > 0) {
                        filtered = filtered.filter(p => checkedBrands.includes(p.brand));
                    }

                    // Ordenar
                    if (sortFilter) {
                        const sortVal = sortFilter.value;
                        if (sortVal === 'price-asc') filtered.sort((a,b) => Number(a.price) - Number(b.price));
                        else if (sortVal === 'price-desc') filtered.sort((a,b) => Number(b.price) - Number(a.price));
                    }

                    if (filtered.length === 0) {
                        fullCatalogContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1.2rem; margin-top: 2rem;">No hay productos con esos filtros.</p>';
                        return;
                    }

                    filtered.forEach(prod => {
                        const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                        const cardHTML = \`
                            <div class="product-card" data-id="\${prod.id}">
                                \${prod.is_offer ? \`<div class="badge">OFERTA</div>\` : ''}
                                <a href="producto.html?id=\${prod.id}"><img src="\${image}" alt="\${prod.name}"></a>
                                <h4><a href="producto.html?id=\${prod.id}" style="color:inherit; text-decoration:none;">\${prod.name}</a></h4>
                                <div class="product-rating">
                                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                                    <span>(4.8)</span>
                                </div>
                                <p class="price">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                                <a href="#" class="btn btn-block add-to-cart-btn">Añadir al carrito</a>
                            </div>\`;
                        fullCatalogContainer.innerHTML += cardHTML;
                    });
                }

                if (priceRange) {
                    priceRange.addEventListener('input', (e) => {
                        priceLabel.innerText = '$' + Number(e.target.value).toLocaleString('es-AR');
                    });
                    priceRange.addEventListener('change', renderCatalog);
                }
                if (sortFilter) sortFilter.addEventListener('change', renderCatalog);
                if (brandFiltersDiv) {
                    brandFiltersDiv.addEventListener('change', (e) => {
                        if (e.target.classList.contains('brand-cb')) renderCatalog();
                    });
                }

                renderCatalog();
                // Omitimos el bloque de if(filtered.length === 0) original porque renderCatalog ya lo hace
                // Para evitar conflicto, comentamos el bloque forEach original
                /*
`;

const replaceWith2 = `
                */
            })
            .catch(err => {
                fullCatalogContainer.innerHTML = '<p>Error cargando catálogo.</p>';
            });
    }
`;

// wait, the easiest way is to rewrite everything from `fetch('http://localhost:3000/api/products')` down to `});` block end.
`;

const actualReplacement = `
// REWRITTEN BY SCRIPT
        fetch('http://localhost:3000/api/products')
            .then(res => res.json())
            .then(products => {
                let baseFiltered = products.filter(p => {
                    if (cat === 'all') return true;
                    const searchStr = (p.name + " " + p.description + " " + (p.brand||'')).toLowerCase();
                    if (cat === 'celulares') return p.category === 'celulares' || searchStr.includes('iphone') || searchStr.includes('galaxy') || searchStr.includes('celular') || searchStr.includes('phone') || searchStr.includes('moto') || searchStr.includes('xiaomi');
                    if (cat === 'notebooks') return p.category === 'notebooks' || searchStr.includes('notebook') || searchStr.includes('laptop') || searchStr.includes('macbook');
                    if (cat === 'tablets') return p.category === 'tablets' || searchStr.includes('tablet') || searchStr.includes('ipad');
                    if (cat === 'accesorios') return p.category === 'accesorios' || searchStr.includes('funda') || searchStr.includes('cargador') || searchStr.includes('auricular') || searchStr.includes('airpod');
                    if (p.brand && p.brand.toLowerCase().trim() === cat.toLowerCase().trim()) return true;
                    return false;
                });
                
                const brands = [...new Set(baseFiltered.map(p => p.brand).filter(Boolean))];
                const brandFiltersDiv = document.getElementById('brand-filters');
                if (brandFiltersDiv && brands.length > 0) {
                    brandFiltersDiv.innerHTML = brands.map(b => \`<label style="cursor:pointer; display:flex; align-items:center; gap:0.5rem;"><input type="checkbox" class="brand-cb" value="\${b}"> \${b}</label>\`).join('');
                } else if (brandFiltersDiv) {
                    brandFiltersDiv.innerHTML = '<span style="color:#888; font-size:0.9rem;">No hay marcas específicas</span>';
                }

                const priceRange = document.getElementById('price-range');
                const priceLabel = document.getElementById('price-label');
                const sortFilter = document.getElementById('sort-filter');

                function renderCatalog() {
                    fullCatalogContainer.innerHTML = '';
                    let filtered = [...baseFiltered];

                    if (priceRange) {
                        const maxPrice = Number(priceRange.value);
                        filtered = filtered.filter(p => Number(p.price) <= maxPrice);
                    }

                    const checkedBrands = Array.from(document.querySelectorAll('.brand-cb:checked')).map(cb => cb.value);
                    if (checkedBrands.length > 0) {
                        filtered = filtered.filter(p => checkedBrands.includes(p.brand));
                    }

                    if (sortFilter) {
                        const sortVal = sortFilter.value;
                        if (sortVal === 'price-asc') filtered.sort((a,b) => Number(a.price) - Number(b.price));
                        else if (sortVal === 'price-desc') filtered.sort((a,b) => Number(b.price) - Number(a.price));
                    }

                    if (filtered.length === 0) {
                        fullCatalogContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; font-size: 1.2rem; margin-top: 2rem;">No hay productos con esos filtros.</p>';
                        return;
                    }

                    filtered.forEach(prod => {
                        const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                        const cardHTML = \`
                            <div class="product-card" data-id="\${prod.id}">
                                \${prod.is_offer ? \`<div class="badge">OFERTA</div>\` : ''}
                                <a href="producto.html?id=\${prod.id}"><img src="\${image}" alt="\${prod.name}"></a>
                                <h4><a href="producto.html?id=\${prod.id}" style="color:inherit; text-decoration:none;">\${prod.name}</a></h4>
                                <div class="product-rating">
                                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                                    <span>(4.8)</span>
                                </div>
                                <p class="price">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                                <a href="#" class="btn btn-block add-to-cart-btn">Añadir al carrito</a>
                            </div>\`;
                        fullCatalogContainer.innerHTML += cardHTML;
                    });
                }

                if (priceRange) {
                    priceRange.addEventListener('input', (e) => {
                        priceLabel.innerText = '$' + Number(e.target.value).toLocaleString('es-AR');
                    });
                    priceRange.addEventListener('change', renderCatalog);
                }
                if (sortFilter) sortFilter.addEventListener('change', renderCatalog);
                if (brandFiltersDiv) {
                    brandFiltersDiv.addEventListener('change', (e) => {
                        if (e.target.classList.contains('brand-cb')) renderCatalog();
                    });
                }

                renderCatalog();
            })
            .catch(err => {
                fullCatalogContainer.innerHTML = '<p style="color:red; text-align:center;">Error cargando catálogo.</p>';
            });
    }
`;

const startIdx = s.indexOf("fetch('http://localhost:3000/api/products')");
// find the end of the if (fullCatalogContainer) { block
// just do string replacement up to `// ==================== BÚSQUEDA INTELIGENTE ====================`
const endIdx = s.indexOf("// ==================== B");

if(startIdx !== -1 && endIdx !== -1) {
    const before = s.substring(0, startIdx);
    const after = s.substring(endIdx);
    fs.writeFileSync('public/script.js', before + actualReplacement + "    // (FIN CATALOGO)\n\n          " + after, 'utf8');
}

