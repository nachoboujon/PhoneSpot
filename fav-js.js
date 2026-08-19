const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const logic = `
// ==================== FAVORITOS (LISTA DE DESEOS) ====================
window.toggleFavorite = (id, event) => {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    let favs = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]');
    if(favs.includes(id)) {
        favs = favs.filter(f => f !== id.toString());
        showToast('Producto eliminado de favoritos', 'fa-heart-crack');
    } else {
        favs.push(id.toString());
        showToast('Producto añadido a favoritos', 'fa-heart');
    }
    localStorage.setItem('phoneSpotFavs', JSON.stringify(favs));
    
    document.querySelectorAll(\`.fav-btn[data-id="\${id}"]\`).forEach(btn => {
        if(favs.includes(id.toString())) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if(document.getElementById('favorites-container')) loadFavoritesUI();
};

document.addEventListener('mouseover', e => {
    const card = e.target.closest('.product-card');
    if (card && !card.querySelector('.fav-btn')) {
        const id = card.getAttribute('data-id');
        if(!id) return;
        const favs = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]');
        const isActive = favs.includes(id.toString()) ? 'active' : '';
        
        const btn = document.createElement('button');
        btn.className = \`fav-btn \${isActive}\`;
        btn.setAttribute('data-id', id);
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.onclick = (ev) => toggleFavorite(id, ev);
        
        card.style.position = 'relative';
        card.appendChild(btn);
    }
});

// Cargar UI en Perfil
window.loadFavoritesUI = async () => {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    
    const favs = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]');
    if (favs.length === 0) {
        container.innerHTML = '<p style="color:#666; grid-column:1/-1;">Tu lista de deseos está vacía. ¡Explora el catálogo para agregar productos!</p>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/products');
        const allProds = await res.json();
        const favProds = allProds.filter(p => favs.includes(p.id.toString()));

        if (favProds.length === 0) {
            container.innerHTML = '<p style="color:#666; grid-column:1/-1;">Los productos guardados ya no están disponibles.</p>';
            return;
        }

        container.innerHTML = '';
        favProds.forEach(prod => {
            const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
            container.innerHTML += \`
                <div class="product-card" data-id="\${prod.id}" style="position:relative; background:white; padding:1rem; border-radius:12px; text-align:center; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
                    <button class="fav-btn active" data-id="\${prod.id}" onclick="toggleFavorite('\${prod.id}', event)"><i class="fa-solid fa-heart"></i></button>
                    <a href="producto.html?id=\${prod.id}"><img src="\${image}" alt="\${prod.name}" style="width:100%; border-radius:8px;"></a>
                    <h4 style="margin:1rem 0 0.5rem;"><a href="producto.html?id=\${prod.id}" style="color:inherit; text-decoration:none;">\${prod.name}</a></h4>
                    <p style="font-weight:bold; color:#111; font-size:1.1rem; margin-bottom:1rem;">$\${Number(prod.price).toLocaleString('es-AR')}</p>
                    <button class="btn btn-block add-to-cart-btn" style="width:100%; padding:0.5rem; border-radius:6px; background:#2e8b57; color:white; border:none; cursor:pointer;">Añadir al carrito</button>
                </div>
            \`;
        });
    } catch(e) {
        container.innerHTML = '<p style="color:red; grid-column:1/-1;">Error al cargar tus favoritos.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('favorites-container')) loadFavoritesUI();
});
`;

fs.writeFileSync('public/script.js', s + '\n' + logic, 'utf8');
