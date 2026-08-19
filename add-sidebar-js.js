const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

const sidebarJs = `
// ==================== SIDEBAR FAVORITOS ====================
window.toggleFavSidebar = () => {
    const sidebar = document.getElementById('fav-sidebar');
    const overlay = document.getElementById('fav-sidebar-overlay');
    if (!sidebar || !overlay) return;
    
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-400px';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
    } else {
        sidebar.style.right = '0px';
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        loadSidebarFavorites();
    }
};

window.loadSidebarFavorites = async () => {
    const container = document.getElementById('fav-sidebar-items');
    if (!container) return;
    
    const favs = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]');
    if (favs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem 0; color: var(--text-muted);"><i class="fa-regular fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i><p>Tu lista de deseos está vacía.</p></div>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/products');
        const allProds = await res.json();
        const favProds = allProds.filter(p => favs.includes(p.id.toString()));

        if (favProds.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align:center;">Los productos guardados ya no están disponibles.</p>';
            return;
        }

        container.innerHTML = '';
        favProds.forEach(prod => {
            const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
            container.innerHTML += \`
                <div class="favorite-sidebar-item" style="display: flex; gap: 1rem; background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid var(--border-color); position: relative;">
                    <!-- Borrar absoluto -->
                    <button onclick="toggleFavorite('\${prod.id}', event); loadSidebarFavorites();" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 71, 87, 0.1); color: #ff4757; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;" title="Eliminar" onmouseover="this.style.background='#ff4757'; this.style.color='white';" onmouseout="this.style.background='rgba(255, 71, 87, 0.1)'; this.style.color='#ff4757';"><i class="fa-solid fa-trash" style="font-size: 0.8rem;"></i></button>

                    <!-- Imagen -->
                    <a href="producto.html?id=\${prod.id}" style="width: 80px; height: 80px; flex-shrink: 0; display: block; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color);">
                        <img src="\${image}" alt="\${prod.name}" style="width: 100%; height: 100%; object-fit: contain; background: white;">
                    </a>
                    
                    <!-- Info -->
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <h4 style="margin: 0 20px 0.5rem 0; font-size: 1rem; line-height: 1.2;"><a href="producto.html?id=\${prod.id}" style="color: var(--text-color); text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#ff4757'" onmouseout="this.style.color='var(--text-color)'">\${prod.name}</a></h4>
                        <p style="margin: 0 0 0.5rem 0; font-weight: 900; color: var(--text-color); font-size: 1.1rem;">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                        
                        <button onclick="
                            const cart = JSON.parse(localStorage.getItem('phoneSpotCart') || '[]');
                            const existing = cart.find(i => i.id == '\${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '\${prod.id}', name: '\${prod.name}', price: \${prod.price}, image: '\${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " style="background: #333333; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; width: 100%; font-size: 0.9rem;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#333333'">
                            <i class="fa-solid fa-cart-plus"></i> Añadir al carrito
                        </button>
                    </div>
                </div>
            \`;
        });
    } catch(e) {
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar tus favoritos.</p>';
    }
};
`;

// Insert the code at the end of the script
if (!s.includes('toggleFavSidebar')) {
    fs.writeFileSync('public/script.js', s + '\n' + sidebarJs, 'utf8');
}

// I should also remove the old favorites list from perfil.html so it doesn't duplicate and confuse users
let perfilHtml = fs.readFileSync('public/perfil.html', 'utf8');
const favRegex = /<h3[^>]*>.*?Mi Lista de Deseos.*?<\/div>[\s]*<\/div>/s;
perfilHtml = perfilHtml.replace(favRegex, '');
fs.writeFileSync('public/perfil.html', perfilHtml, 'utf8');

console.log('Sidebar JS added and Perfil cleaned!');
