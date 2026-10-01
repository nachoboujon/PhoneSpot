// Offer visibility is saved independently of pending price, stock and photo edits.
(() => {
    window.toggleProductOffer = async (button, id) => {
        if (button.disabled) return;
        const product = window[`adminProduct_${id}`];
        const controls = button.closest('.admin-offer-controls');
        const status = controls.querySelector('.admin-offer-status');
        if (!product) return;
        const nextOffer = !product.is_offer;
        const originalLabel = button.textContent;
        button.disabled = true;
        controls.setAttribute('aria-busy', 'true');
        button.textContent = 'Guardando…';
        status.textContent = '';
        try {
            const response = await fetch(`${window.API_URL}/api/products/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('phoneSpotToken') || ''}`},
                body: JSON.stringify({is_offer: nextOffer})
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'No pudimos guardar la oferta. Intentá nuevamente.');
            if (typeof result.is_offer !== 'boolean') throw new Error('No pudimos comprobar el estado. Recargá la lista antes de volver a intentar.');
            product.is_offer = result.is_offer;
            button.textContent = product.is_offer ? 'Quitar oferta' : 'Poner en oferta';
            button.setAttribute('aria-pressed', String(product.is_offer));
            controls.querySelector('.admin-offer-state').textContent = product.is_offer ? 'Publicado en Ofertas del Día' : 'No está en oferta';
            status.textContent = product.is_offer ? 'Oferta activada.' : 'Oferta quitada.';
        } catch (error) {
            button.textContent = originalLabel;
            status.textContent = error.message || 'No pudimos guardar. Revisá la conexión e intentá nuevamente.';
        } finally {
            button.disabled = false;
            controls.removeAttribute('aria-busy');
        }
    };
})();
