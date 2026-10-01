(() => {
    window.readFavoriteIds = () => {
        try {const ids = JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); return Array.isArray(ids) ? [...new Set(ids.map(String))] : [];}
        catch (_) {return [];}
    };
    function syncButton(button, saved) {
        button.classList.toggle('active', saved);
        button.setAttribute('aria-pressed', String(saved));
        button.setAttribute('aria-label', saved ? 'Quitar de favoritos' : 'Agregar a favoritos');
        button.title = saved ? 'Quitar de favoritos' : 'Agregar a favoritos';
        const icon = button.querySelector('i');
        if (icon) icon.className = `${saved ? 'fa-solid' : 'fa-regular'} fa-heart`;
        const label = button.querySelector('.favorite-button-label');
        if (label && label.textContent !== (saved ? 'En favoritos' : 'Guardar en favoritos')) label.textContent = saved ? 'En favoritos' : 'Guardar en favoritos';
    }
    window.syncFavoritesUI = () => {
        const ids = new Set(window.readFavoriteIds());
        document.querySelectorAll('.product-card[data-id], .product-details[data-id]').forEach(product => {
            const id = product.dataset.id, saved = ids.has(id);
            let button = product.querySelector('.fav-btn');
            if (!button) {
                button = document.createElement('button'); button.type = 'button'; button.dataset.id = id;
                button.className = 'fav-btn' + (product.matches('.product-details') ? ' favorite-detail-button' : '');
                button.innerHTML = '<i class="fa-regular fa-heart" aria-hidden="true"></i>' + (product.matches('.product-details') ? '<span class="favorite-button-label"></span>' : '');
                button.addEventListener('click', event => window.toggleFavorite(id, event));
                (product.querySelector('.product-purchase-actions') || product).append(button);
            }
            syncButton(button, saved);
            product.classList.toggle('is-favorite', saved);
            if (product.matches('.product-card')) {
                let marker = product.querySelector('.favorite-marker');
                if (!marker) {marker = document.createElement('span'); marker.className = 'favorite-marker'; marker.textContent = 'En favoritos'; (product.querySelector('h4') || button).after(marker);}
                marker.hidden = !saved;
            }
        });
    };
    function start() {
        window.syncFavoritesUI();
        new MutationObserver(records => {
            if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('.product-card, .product-details') || node.querySelector('.product-card, .product-details'))))) window.syncFavoritesUI();
        }).observe(document.body, {childList: true, subtree: true});
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
    window.addEventListener('storage', event => {if (event.key === 'phoneSpotFavs') window.syncFavoritesUI();});
})();
