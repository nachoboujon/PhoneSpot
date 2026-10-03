(() => {
    let busy = false;
    let reviewedCart = '';
    let lockedControls = [];
    const signature = items => JSON.stringify(items.map(item => [item.id, item.variant_name || '', item.quantity, item.price]));
    const field = id => document.getElementById(id);
    function showFieldError(input, message) {
        let error = field(`${input.id}-error`);
        if (!error && message) {
            error = document.createElement('span');
            error.id = `${input.id}-error`;
            error.className = 'checkout-field-error';
            input.insertAdjacentElement('afterend', error);
            const descriptions = new Set((input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
            descriptions.add(error.id);
            input.setAttribute('aria-describedby', [...descriptions].join(' '));
        }
        if (error) error.textContent = message;
        input.setAttribute('aria-invalid', String(Boolean(message)));
    }
    window.PhoneSpotCheckout = {
        requestKey(items) {
            const current = signature(items);
            let stored; try {stored = JSON.parse(sessionStorage.getItem('phoneSpotCheckoutKey') || 'null');} catch (_) {}
            if (!stored || stored.signature !== current) {stored={signature:current, key:crypto.randomUUID()}; sessionStorage.setItem('phoneSpotCheckoutKey',JSON.stringify(stored));}
            return stored.key;
        },
        async recoverPending() {
            let stored;try {stored=JSON.parse(sessionStorage.getItem('phoneSpotCheckoutPending') || 'null');} catch (_) {return false;}
            if(!stored) return false;
            const response=await fetch('/api/orders/result?key='+encodeURIComponent(stored.key)+'&cart='+encodeURIComponent(stored.cart));
            if(response.status===404) return false;
            if(!response.ok) throw new Error('No pudimos comprobar tu pedido anterior. Intentá nuevamente.');
            const data=await response.json();
            const phone=String(window.phoneSpotSettings?.whatsapp_number || '5493447416011').replace(/\D/g,'') || '5493447416011';
            const wpUrl='https://wa.me/'+phone+'?text='+encodeURIComponent('Hola PhoneSpot, quiero coordinar el pago y el envio de mi pedido #'+data.orderId+'.');
            sessionStorage.setItem('phoneSpotOrderConfirmation',JSON.stringify({orderId:String(data.orderId),total:Number(data.total_ars),wpUrl,createdAt:Date.now()}));
            sessionStorage.removeItem('phoneSpotCheckoutPending');sessionStorage.removeItem('phoneSpotCheckoutDraft');sessionStorage.removeItem('phoneSpotCheckoutKey');
            this.confirmed=true;location.assign('compra-exitosa.html?orderId='+encodeURIComponent(data.orderId));return true;
        },
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
                showFieldError(input, input.checkValidity() ? '' : input.validationMessage);
            }
            const invalid = inputs.find(input => !input.checkValidity());
            if (invalid) {
                this.step(1);
                invalid.focus();
                this.message('Revisá los campos indicados para continuar.');
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
            field(number === 2 ? 'checkout-review-title' : 'checkout-contact-title')?.focus();
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
            this.uncertain = false;
            this.message('La conexión se interrumpió. Podés reintentar: usamos el mismo identificador para evitar pedidos duplicados. ');

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
        if (event.target.matches('input, select')) {
            const error = field(`${event.target.id}-error`);
            if (error) error.textContent = '';
            event.target.removeAttribute('aria-invalid');
        }
    });
})();

// Save the form only for this browser session; never persist it across devices.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checkout-form'); if (!form) return;
    window.PhoneSpotCheckout.recoverPending().catch(error=>window.PhoneSpotCheckout.message(error.message));
    let draft; try {draft = JSON.parse(sessionStorage.getItem('phoneSpotCheckoutDraft') || '{}');} catch (_) {draft={};}
    for (const field of form.querySelectorAll('input[id],select[id]')) if (draft[field.id] && !field.value) field.value=draft[field.id];
    form.addEventListener('input', () => { const values={}; for (const field of form.querySelectorAll('input[id],select[id]')) values[field.id]=field.value; sessionStorage.setItem('phoneSpotCheckoutDraft',JSON.stringify(values)); });
});
