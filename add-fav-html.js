const fs = require('fs');
let s = fs.readFileSync('public/perfil.html', 'utf8');

const oldComprasStr = '<h3 style="margin-bottom: 1.5rem; border-bottom: 2px solid #2e8b57; display: inline-block; padding-bottom: 0.5rem;"><i class="fa-solid fa-box"></i> Mis Compras</h3>';
const favStr = `
        <div style="background: #f9f9f9; padding: 2rem; border-radius: 12px; border: 1px solid #eee; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1.5rem; border-bottom: 2px solid #ff4757; display: inline-block; padding-bottom: 0.5rem;"><i class="fa-solid fa-heart" style="color:#ff4757;"></i> Mi Lista de Deseos</h3>
            
            <div id="favorites-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
                <p style="color: #666; grid-column: 1/-1;">Cargando favoritos...</p>
            </div>
        </div>
`;

s = s.replace(oldComprasStr, favStr + '\n' + oldComprasStr);
fs.writeFileSync('public/perfil.html', s, 'utf8');
