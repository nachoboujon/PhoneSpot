(() => {
    let busy = false;
    let reviewedCart = '';
    let lockedControls = [];
    const signature = items => JSON.stringify(items.map(item => [item.id, item.variant_name || '', item.quantity, item.price]));
    const field = id => document.getElementById(id);
    window.PhoneSpotCheckout = {
        confirmed: false,
        uncertain: false,
        isLocked() { return busy || this.confirmed || this.uncertain; },
        validate() {
            const inputs = [...document.querySelectorAll('#checkout-part1 input, #checkout-part1 select')];
            for (const input of inputs) {
                input.setCustomValidity('');
                if (input.required && !input.value.trim()) input.setCustomValidity('Completá este campo.');
                if (input.id === 'chk-email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) input.setCustomValidity('Ingresá un email válido.');
                if (input.id === 'chk-phone' && !isValidPhone(input.value)) input.setCustomValidity('Ingresá un teléfono argentino válido, con código de área.');
                if (input.id === 'chk-zip' && !/^(?:\d{4,5}|[a-z]\d{4}[a-z]{3})$/i.test(input.value.trim())) input.setCustomValidity('Ingresá un código postal válido: 4 o 5 números, o CPA.');
                input.setAttribute('aria-invalid', String(!input.checkValidity()));
            }
            const invalid = inputs.find(input => !input.checkValidity());
            if (invalid) {
                this.step(1);
                invalid.focus();
                invalid.reportValidity();
                this.message('Revisá el campo indicado para continuar.');
                return false;
            }
            if (!document.querySelector('input[name="shipping_method"]:checked')) {
                this.message('Ingresá tu código postal para seleccionar el envío.');
                this.step(1);
                field('chk-zip').focus();
                return false;
            }
            this.message('');
            return true;
        },
        step(number) {
            field('checkout-part1').style.display = number === 1 ? 'block' : 'none';
            field('checkout-part2').style.display = number === 2 ? 'block' : 'none';
            for (const step of [1, 2]) {
                const indicator = field(`step${step}-indicator`);
                indicator.classList.toggle('active', number === step);
                if (number === step) indicator.setAttribute('aria-current', 'step');
                else indicator.removeAttribute('aria-current');
            }
            if (number === 2) field('checkout-review-title').focus();
        },
        review(items) {
            reviewedCart = signature(items);
            const values = [
                ['Contacto', `${field('chk-name').value.trim()} ${field('chk-lastname').value.trim()}`],
                ['Email', field('chk-email').value.trim()],
                ['WhatsApp', field('chk-phone').value.trim()],
                ['Entrega', `${field('chk-address').value.trim()}, ${field('chk-city').value.trim()}, ${field('chk-province').value} · CP ${field('chk-zip').value.trim()}`],
                ['Envío', 'Método y costo final a coordinar por WhatsApp']
            ];
            field('checkout-review').replaceChildren(...values.flatMap(([label, value]) => {
                const term = document.createElement('dt'); term.textContent = label;
                const description = document.createElement('dd'); description.textContent = value;
                return [term, description];
            }));
            this.step(2);
        },
        matchesReview(items) {
            if (signature(items) === reviewedCart) return true;
            reviewedCart = signature(items);
            this.message('Tu carrito cambió. Revisá el resumen actualizado antes de volver a confirmar.');
            return false;
        },
        message(text) { field('checkout-status').textContent = text; },
        markUncertain() {
            this.uncertain = true;
            this.message('No pudimos confirmar el resultado. Revisá tus pedidos antes de volver a enviar. ');
            const link = document.createElement('a'); link.href = 'perfil.html'; link.textContent = 'Ver mis pedidos';
            field('checkout-status').append(link);
        },
        begin() {
            if (busy || this.confirmed || this.uncertain) return false;
            busy = true;
            lockedControls = [...document.querySelectorAll('#checkout-form input, #checkout-form select, #checkout-form button, #coupon-input, #coupon-input + button')]
                .map(control => ({control, disabled: control.disabled}));
            lockedControls.forEach(({control}) => {control.disabled = true;});
            field('checkout-form').setAttribute('aria-busy', 'true');
            field('btn-confirm-pay').textContent = 'Confirmando pedido…';
            this.message('Verificando tu reserva y registrando el pedido.');
            return true;
        },
        finish() {
            if (this.confirmed) return;
            lockedControls.forEach(({control, disabled}) => {control.disabled = disabled;});
            field('checkout-form').removeAttribute('aria-busy');
            field('btn-confirm-pay').textContent = 'Confirmar pedido';
            if (this.uncertain) { field('btn-confirm-pay').disabled = true; field('btn-confirm-pay').textContent = 'Resultado pendiente de verificar'; }
            busy = false;
        }
    };
    function isValidPhone(value) {
        const national = value.replace(/\D/g, '').replace(/^54/, '').replace(/^9/, '');
        return /^\d{10}$/.test(national) && !/^(\d)\1+$/.test(national);
    }
    document.addEventListener('input', event => {
        if (!event.target.closest('#checkout-form')) return;
        event.target.setCustomValidity?.('');
        event.target.removeAttribute('aria-invalid');
    });
})();
