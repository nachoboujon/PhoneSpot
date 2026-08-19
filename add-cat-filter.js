const fs = require('fs');
let s = fs.readFileSync('public/catalogo.html', 'utf8');

const target = `<div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Filtrar por Precio <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>`;

const replacement = `<div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Categorías <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>
                    <div id="category-filters" style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" value="celulares" class="cat-checkbox" style="accent-color: #555555; width: 18px; height: 18px;">
                            Celulares
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" value="notebooks" class="cat-checkbox" style="accent-color: #555555; width: 18px; height: 18px;">
                            Notebooks
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" value="tablets" class="cat-checkbox" style="accent-color: #555555; width: 18px; height: 18px;">
                            Tablets
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" value="accesorios" class="cat-checkbox" style="accent-color: #555555; width: 18px; height: 18px;">
                            Accesorios
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Filtrar por Precio <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>`;

if (s.includes('<h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">\n                        Filtrar por Precio')) {
    s = s.replace(target, replacement);
    fs.writeFileSync('public/catalogo.html', s, 'utf8');
    console.log('Category filter added to catalogo.html');
} else {
    console.log('Target not found in catalogo.html');
}
