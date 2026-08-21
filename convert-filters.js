const fs = require('fs');
let html = fs.readFileSync('public/catalogo.html', 'utf8');

const regexFilterBlock = /<div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var\(--border-color\);">[\s\S]*?<div id="category-filters" style="display: flex; flex-direction: column; gap: 0\.8rem; margin-top: 1rem;">[\s\S]*?<\/div>\s*<\/div>/;

const newFilterBlock = `<details open style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <summary style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; list-style: none; font-weight: bold; color: var(--text-color);">
                        <span><i class="fa-solid fa-filter" style="margin-right:8px; font-size:1rem;"></i> Categorías</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </summary>
                    <div id="category-filters" style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; padding-top: 0.5rem;">
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
                </details>`;

html = html.replace(regexFilterBlock, () => newFilterBlock);
fs.writeFileSync('public/catalogo.html', html, 'utf8');

// I also need to make it closed by default ONLY on mobile, but open on desktop.
// I can do this with CSS or a quick script at the bottom of catalogo.html
let css = fs.readFileSync('public/style.css', 'utf8');
if (!css.includes('details > summary::marker')) {
    css += `\n\n/* Ocultar el triangulito nativo de details */\ndetails > summary::marker, details > summary::-webkit-details-marker { display: none; content: ""; }\n`;
    css += `\n/* Cerrar filtros en mobile por defecto, se maneja con JS o CSS? 
    Mejor con JS para quitar el atributo open en mobile */\n`;
    fs.writeFileSync('public/style.css', css, 'utf8');
}

console.log('Filters converted to dropdown');
