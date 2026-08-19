const fs = require('fs');
let s = fs.readFileSync('public/catalogo.html', 'utf8');

const target = `<div style="margin-bottom: 2rem; padding-bottom: 1rem;">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Condición <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" checked style="accent-color: #555555; width: 18px; height: 18px;">
                            Nuevo, Caja Sellada
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" id="americano-filter" style="accent-color: #555555; width: 18px; height: 18px;">
                            Equipos Americanos (iPhone)
                        </label>
                    </div>
                </div>`;

const replacement = `<div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Condición <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" checked style="accent-color: #555555; width: 18px; height: 18px;">
                            Nuevo, Caja Sellada
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" id="americano-filter" style="accent-color: #555555; width: 18px; height: 18px;">
                            Equipos Americanos (iPhone)
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 2rem; padding-bottom: 1rem;">
                    <h3 style="font-size: 1.2rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        Promociones <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem;"></i>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                            <input type="checkbox" id="offer-filter" style="accent-color: #ff4757; width: 18px; height: 18px;">
                            Solo en Oferta Relámpago
                        </label>
                    </div>
                </div>`;

if(s.includes(target)) {
    s = s.replace(target, replacement);
    fs.writeFileSync('public/catalogo.html', s, 'utf8');
    console.log('Added Offer filter to catalogo.html');
} else {
    console.log('Target not found in catalogo.html');
}
