const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /container\.innerHTML \+= `[\s\S]*?`;/g;
// Wait, I should just replace the entire favProds.forEach loop.

const newLoop = `
        favProds.forEach(prod => {
            const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
            container.innerHTML += \`
                <div class="favorite-item" data-id="\${prod.id}" style="display: flex; align-items: center; gap: 1.5rem; background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 1rem; flex-wrap: wrap;">
                    
                    <!-- Imagen -->
                    <a href="producto.html?id=\${prod.id}" style="width: 100px; height: 100px; flex-shrink: 0; display: block;">
                        <img src="\${image}" alt="\${prod.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; background: white; padding: 5px; border: 1px solid var(--border-color);">
                    </a>
                    
                    <!-- Info -->
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="margin: 0 0 0.5rem; font-size: 1.2rem;"><a href="producto.html?id=\${prod.id}" style="color: var(--text-color); text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#ff4757'" onmouseout="this.style.color='var(--text-color)'">\${prod.name}</a></h4>
                        <p style="margin: 0; font-weight: 900; color: var(--text-color); font-size: 1.3rem;">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                    </div>

                    <!-- Botones -->
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <button onclick="
                            const cart = JSON.parse(localStorage.getItem('phoneSpotCart') || '[]');
                            const existing = cart.find(i => i.id == '\${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '\${prod.id}', name: '\${prod.name}', price: \${prod.price}, image: '\${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " class="btn" style="background: #333333; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#333333'">
                            <i class="fa-solid fa-cart-plus" style="margin-right: 5px;"></i> Añadir
                        </button>
                        
                        <button onclick="toggleFavorite('\${prod.id}', event); loadFavoritesUI();" style="background: rgba(255, 71, 87, 0.1); color: #ff4757; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: 0.3s; font-size: 1.2rem;" title="Eliminar de favoritos" onmouseover="this.style.background='#ff4757'; this.style.color='white';" onmouseout="this.style.background='rgba(255, 71, 87, 0.1)'; this.style.color='#ff4757';">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            \`;
        });
`;

let content = s.replace(/favProds\.forEach\(prod => \{[\s\S]*?\}\);/, newLoop.trim());
fs.writeFileSync('public/script.js', content, 'utf8');

// I also need to change the CSS of 'favorites-container' in perfil.html so it is no longer a grid.
let perfilHtml = fs.readFileSync('public/perfil.html', 'utf8');
perfilHtml = perfilHtml.replace(/<div id="favorites-container" style="display: grid; grid-template-columns: repeat\(auto-fill, minmax\(200px, 1fr\)\); gap: 1\.5rem;">/, '<div id="favorites-container" style="display: flex; flex-direction: column; gap: 0.5rem;">');
fs.writeFileSync('public/perfil.html', perfilHtml, 'utf8');

console.log('Favorites UI redesigned!');
