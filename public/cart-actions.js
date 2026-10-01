// Small, framework-free controller shared by catalog cards and product details.
(() => {
    const pending = new WeakSet();
    let queue = Promise.resolve();
    window.PhoneSpotCartActions = {
        isPending(card) { return pending.has(card); },
        enqueue(task) {
            const result = queue.then(task);
            queue = result.catch(() => {});
            return result;
        },
        async run(card, button, task) {
            if (pending.has(card)) return;
            pending.add(card);
            const original = button.innerHTML;
            const controls = [...card.querySelectorAll('.var-btn, .var-select, .gallery-thumb')]
                .map(control => ({control, disabled: control.disabled}));
            let status = card.querySelector('.cart-action-status');
            if (!status) {
                status = document.createElement('p');
                status.className = 'cart-action-status';
                status.setAttribute('role', 'status');
                status.setAttribute('aria-live', 'polite');
                status.setAttribute('aria-atomic', 'true');
                button.insertAdjacentElement('afterend', status);
            }
            card.dataset.cartState = 'pending';
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.innerHTML = '<i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Agregando…';
            status.textContent = 'Confirmando disponibilidad…';
            controls.forEach(({control}) => {control.disabled = true;});
            try {
                const result = await task();
                if (!result) return;
                card.dataset.cartState = 'success';
                button.disabled = true;
                button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Agregado';
                status.replaceChildren(document.createTextNode(result.syncPending ? 'Agregado. Estamos actualizando el carrito. ' : 'Producto agregado. '));
                const link = document.createElement('a');
                link.href = 'carrito.html';
                link.textContent = 'Ver carrito';
                status.append(link);
                // Briefly retain the lock so rapid clicks do not add unwanted units.
                await new Promise(resolve => setTimeout(resolve, 900));
            } catch (error) {
                card.dataset.cartState = 'error';
                status.textContent = error.message || 'No pudimos agregar el producto. Intentá nuevamente.';
            } finally {
                controls.forEach(({control, disabled}) => {control.disabled = disabled;});
                button.removeAttribute('aria-busy');
                const outOfStock = card.dataset.variantStock === '0';
                button.disabled = outOfStock;
                button.innerHTML = outOfStock ? '<i class="fa-solid fa-box-open" aria-hidden="true"></i> Sin stock' : original;
                if (card.dataset.cartState === 'pending') delete card.dataset.cartState;
                pending.delete(card);
            }
        }
    };
    const clearFeedback = event => {
        if (!event.target.closest('.var-btn, .var-select')) return;
        const card = event.target.closest('.product-card, .product-details');
        if (!card || pending.has(card)) return;
        delete card.dataset.cartState;
        const status = card.querySelector('.cart-action-status');
        if (status) status.textContent = '';
    };
    document.addEventListener('change', clearFeedback);
    document.addEventListener('click', clearFeedback);
})();
