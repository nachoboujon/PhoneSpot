const fs = require('fs');
let c = fs.readFileSync('public/catalogo.html', 'utf8');

const replaceWith = `<div style="display: flex; gap: 2rem; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
            <h2 id="catalog-title" style="font-size: 2.5rem; margin: 0;">Catálogo Completo</h2>
            <select id="sort-filter" style="padding: 0.8rem; border-radius: 8px; border: 1px solid #ddd; outline: none; font-family: inherit; font-weight: bold; cursor: pointer;">
                <option value="">Ordenar por...</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
            </select>
        </div>
        
        <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
            <div id="filters-sidebar" style="flex: 0 0 250px; background: #f9f9f9; padding: 1.5rem; border-radius: 12px; border: 1px solid #eee;">
                <h3 style="margin-bottom: 1rem; font-size: 1.2rem; border-bottom: 2px solid #2e8b57; padding-bottom: 0.5rem; display: inline-block;"><i class="fa-solid fa-filter"></i> Filtros</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">Precio Máximo: <span id="price-label" style="color: #2e8b57;">$3.000.000</span></label>
                    <input type="range" id="price-range" min="50000" max="3000000" step="50000" value="3000000" style="width: 100%; accent-color: #2e8b57; cursor: pointer;">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">Marcas</label>
                    <div id="brand-filters" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <!-- Rellenado por JS -->
                    </div>
                </div>
            </div>

            <div class="product-grid" id="full-catalog-container" style="flex: 1; min-width: 300px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">`;

c = c.replace(/<h2 id="catalog-title"[^>]*>.*?<\/h2>\s*<div class="product-grid" id="full-catalog-container">/, replaceWith);

c = c.replace(/<\/div>\s*<\/main>/, '</div></div></main>');

fs.writeFileSync('public/catalogo.html', c, 'utf8');
