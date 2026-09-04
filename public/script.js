window.phoneSpotSettings = window.phoneSpotSettings || {};

// ==================== CONFIGURACIÓN DE API ====================
// Cambia 'http://localhost:3000' por la URL de tu servidor en producción (ej. 'https://tu-backend.onrender.com')
window.API_URL = '';
// ==============================================================

// Analítica mínima y respetuosa de privacidad. No envía texto de búsqueda ni datos personales.
window.trackStoreEvent = (eventType, details = {}) => {
    const payload = {
        event_type: eventType,
        product_id: Number.isInteger(Number(details.productId)) ? Number(details.productId) : null,
        page_path: window.location.pathname,
        query_length: Number.isFinite(Number(details.queryLength)) ? Number(details.queryLength) : undefined
    };
    fetch(window.API_URL + '/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
    }).catch(() => {});
};

if (!sessionStorage.getItem(`phonespot:viewed:${window.location.pathname}${window.location.search}`)) {
    sessionStorage.setItem(`phonespot:viewed:${window.location.pathname}${window.location.search}`, '1');
    window.trackStoreEvent('page_view');
}


// ==================== IMAGE HELPER ====================
window.getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return window.API_URL + url;
};
// ======================================================

// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta + 5; })
    .catch(e => console.error('Error fetching dolar', e));


// ==================== AUTH GUARD ====================
if (window.location.pathname.includes('checkout.html') && !localStorage.getItem('phoneSpotToken')) {
    window.location.href = 'login.html?redirect=checkout.html';
}
window.goToCheckout = (e) => {
    if (e) e.preventDefault();
    if (!localStorage.getItem('phoneSpotToken')) {
        showToast('Debes iniciar sesión para comprar', 'fa-lock');
        setTimeout(() => window.location.href = 'login.html?redirect=checkout.html', 1500);
    } else {
        window.trackStoreEvent('checkout_started');
        window.location.href = 'checkout.html';
    }
};
// ====================================================

window.formatPrice = (usdPrice) => {
    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');
};

window.formatArs = (arsPrice) => '$' + Number(arsPrice || 0).toLocaleString('es-AR');

const escapeText = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
// ====================================================

// Sistema de Notificaciones Elegantes (Toast)
function showToast(message, icon = 'fa-circle-check') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3300);
}

// Estado del carrito en LocalStorage
let cart = [];
try {
    const rawCart = localStorage.getItem('phoneSpotCart');
    if (rawCart) {
        cart = JSON.parse(rawCart) || [];
        cart = cart.filter(item => item.price && !isNaN(item.price));
    }
} catch(e) {
    console.error('Cart parse error, resetting', e);
    localStorage.removeItem('phoneSpotCart');
}

function saveCart() {
    localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const countBadge = document.getElementById('cart-count-badge');
    if (countBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countBadge.innerText = totalItems > 0 ? `(${totalItems})` : '';
    }
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id && item.variant_name === product.variant_name);
    
    // Check max stock if available
    const maxStock = product.maxStock !== undefined ? product.maxStock : Infinity;
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + 1 > maxStock) {
        showToast('No hay más stock disponible de este producto', 'fa-triangle-exclamation');
        return;
    }

    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    window.trackStoreEvent('add_to_cart', { productId: product.id });
    
    // Notificación y abrir carrito lateral
    showToast(`¡${product.name} añadido al carrito!`);
    if (window.openSideCart && !window.location.pathname.includes('carrito.html') && !window.location.pathname.includes('checkout.html')) {
        window.openSideCart();
    }
}

function removeFromCart(id, variant_name = '') {
    cart = cart.filter(item => !(item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || ''))));
    saveCart();
    renderCart(); // Solo ítil si estámás en carrito.html
    if (typeof renderSideCart === 'function') renderSideCart();
}

function changeQuantity(id, newQuantity, variant_name = '') {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id && String(item.variant_name || '') === String(decodeURIComponent(variant_name || '')));
    if (item) {
        const max = item.maxStock !== undefined ? item.maxStock : Infinity;
        if (newQuantity > max) {
            showToast('Límite de stock alcanzado', 'fa-triangle-exclamation');
            return;
        }
        item.quantity = newQuantity;
        saveCart();
        renderCart();
        if (typeof renderSideCart === 'function') renderSideCart();
    }
}

async function renderSideCart() { 
        await window.dolarPromise; 
    const sideContainer = document.getElementById('side-cart-items');
    const sideTotal = document.getElementById('side-cart-total');
    if (!sideContainer || !sideTotal) return;

    sideContainer.innerHTML = '';
    let total = 0;
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;

    if (cart.length === 0) {
        sideContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:#aaa; text-align:center;">
                <i class="fa-solid fa-cart-arrow-down" style="font-size:3rem; margin-bottom:1rem;"></i>
                <p>Tu carrito está vacío.</p>
                <button class="btn" style="margin-top:1rem;" onclick="document.getElementById('close-cart-btn').click()">Seguir comprando</button>
            </div>`;
        sideTotal.innerText = '$0';
        const fsc = document.getElementById('free-shipping-container');
        if(fsc) fsc.style.display = 'none';
        
        // Remove wholesale banner if exists
        const oldBanner = document.getElementById('wholesale-banner-side');
        if (oldBanner) oldBanner.remove();
        
        return;
    }

    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
        total += finalPrice * item.quantity;
        
        sideContainer.innerHTML += `
            <div class="side-cart-item">
                <img src="${item.img || item.image || item.image_url}" alt="${item.name}">
                <div class="side-cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.variant_name || ''}</p>
                    ${isWholesale ? `<p style="color: #ff4757; font-size:0.8rem; text-decoration:line-through;">${window.formatPrice(item.price)}</p>` : ''}
                    <p style="color: var(--text-color); font-weight:bold; margin-top:0.3rem;">${window.formatPrice(finalPrice)} x ${item.quantity}</p>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <div style="display:flex; align-items:center; gap:0.5rem; background:#eee; border-radius:4px; padding:0.1rem;">
                        <button onclick="changeQuantity('${item.id}', ${item.quantity - 1}, '${encodeURIComponent(item.variant_name || String())}')" style="border:none; background:none; cursor:pointer; width:20px;">-</button>
                        <span style="font-size:0.8rem; font-weight:bold;">${item.quantity}</span>
                        <button onclick="changeQuantity('${item.id}', ${item.quantity + 1}, '${encodeURIComponent(item.variant_name || String())}')" style="border:none; background:none; cursor:pointer; width:20px;">+</button>
                    </div>
                    <span class="side-cart-remove" onclick="removeFromCart('${item.id}', '${encodeURIComponent(item.variant_name || String())}')"><i class="fa-solid fa-trash"></i> Quitar</span>
                </div>
            </div>
        `;
    });
    
    
    
    let bannerHtml = '';
    
    let nextTierQty = 3;
    let nextTierDiscount = 5;
    if (totalQuantity >= 10) { nextTierQty = 0; }
    else if (totalQuantity >= 5) { nextTierQty = 10; nextTierDiscount = 10; }
    else if (totalQuantity >= 3) { nextTierQty = 5; nextTierDiscount = 7; }

    if (totalQuantity >= 10) {
        bannerHtml = `<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 15px;">
                        <i class="fa-solid fa-crown"></i> ¡Máximo Descuento Mayorista aplicado! (-${wholesaleDiscount} USD c/u)
                      </div>`;
    } else if (isWholesale) {
        const remaining = nextTierQty - totalQuantity;
        bannerHtml = `<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 15px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Activo! (-${wholesaleDiscount} USD c/u)<br>
                        <span style="font-size:0.75rem; color:#d35400;">(Agrega ${remaining} más para llegar a -${nextTierDiscount} USD c/u)</span>
                      </div>`;
    } else {
        const remaining = 3 - totalQuantity;
        bannerHtml = `<div id="wholesale-banner-side" style="background:#fff3e0; color:#e65100; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 15px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega ${remaining} equipo${remaining > 1 ? 's' : ''} más para activar Precio Mayorista (-5 USD c/u)
                      </div>`;
    }

    // Insert banner at the TOP of the items list
    sideContainer.innerHTML = bannerHtml + sideContainer.innerHTML;

    
    sideTotal.innerText = `${window.formatPrice(total)}`;

    const fsText = document.getElementById('free-shipping-text');
    const fsBar = document.getElementById('free-shipping-bar');
    var settings_ml = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    const threshold = settings_ml.free_shipping_threshold;
    
    if (fsText && fsBar && threshold > 0) {
        document.getElementById('free-shipping-container').style.display = 'block';
        const totalArs = total * window.dolarValue;
        if (totalArs >= threshold) {
            fsText.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#555555;"></i> ¡¿Tienes envío GRATIS!';
            fsBar.style.width = '100%';
            fsBar.style.background = '#555555';
        } else {
            const missing = threshold - totalArs;
            const pct = Math.min((totalArs / threshold) * 100, 100);
            fsText.innerHTML = `Te faltan <strong>${window.formatArs(missing)}</strong> para Envío Gratis`;
            fsBar.style.width = `${pct}%`;
            fsBar.style.background = '#f39c12';
        }
    } else if (fsText) {
        document.getElementById('free-shipping-container').style.display = 'none';
    }
}

// Renderizado dinámico del carrito (carrito.html)
async function renderCart() { await window.dolarPromise; 
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Tu carrito está vacío.</p>';
        cartTotalElement.innerText = '$0';
        return;
    }

    
    // Wholesale banner injection
    let nextTierQty = 3;
    let nextTierDiscount = 5;
    if (totalQuantity >= 10) { nextTierQty = 0; }
    else if (totalQuantity >= 5) { nextTierQty = 10; nextTierDiscount = 10; }
    else if (totalQuantity >= 3) { nextTierQty = 5; nextTierDiscount = 7; }

    if (totalQuantity >= 10) {
        cartItemsContainer.innerHTML += `<div style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-crown"></i> ¡Máximo Descuento Mayorista aplicado! (-${wholesaleDiscount} USD c/u)
                      </div>`;
    } else if (isWholesale) {
        const remaining = nextTierQty - totalQuantity;
        cartItemsContainer.innerHTML += `<div style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:0.95rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Activo! (-${wholesaleDiscount} USD c/u)<br>
                        <span style="font-size:0.85rem; color:#d35400;">(Agrega ${remaining} más para llegar a -${nextTierDiscount} USD c/u)</span>
                      </div>`;
    } else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += `<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega ${remaining} equipo${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-5 USD c/u)
                      </div>`;
    }

    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
        total += finalPrice * item.quantity;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <img src="${item.img || item.image || item.image_url}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                ${item.variant_name ? `<p>${item.variant_name}</p>` : ''}
                ${isWholesale ? `<p style="color: #ff4757; text-decoration:line-through; font-size: 0.8rem; margin: 0;">Precio Base: ${window.formatPrice(item.price * item.quantity)}</p>` : ''}
                <div class="item-quantity" style="margin-top: 5px;">
                    <span>Cantidad:</span>
                    <input type="number" value="${item.quantity}" min="1" onchange="changeQuantity('${item.id}', parseInt(this.value), '${encodeURIComponent(item.variant_name || String())}')">
                </div>
            </div>
            <div class="item-price" style="display:flex; flex-direction:column; align-items:flex-end;">
                <strong style="font-size: 1.2rem; color: var(--text-color);">${window.formatPrice(finalPrice * item.quantity)}</strong>
                ${isWholesale ? `<span style="color:#2e7d32; font-size: 0.8rem;">( -${wholesaleDiscount} USD aplicado )</span>` : ''}
            </div>
            <button onclick="removeFromCart('${item.id}', '${encodeURIComponent(item.variant_name || String())}')" style="background:none; color: var(--text-muted); padding:0; width:auto; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    
    var settings_ml = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    var thresholdARS = settings_ml.free_shipping_threshold;
    var currentTotalARS = total * window.dolarValue;
    
    if (thresholdARS > 0) {
        let percent = Math.min(100, Math.round((currentTotalARS / thresholdARS) * 100));
        let remaining = thresholdARS - currentTotalARS;
        
        let message = remaining > 0 ? `Te faltan <b style="color:var(--text-color); font-size:1rem;">${'$' + remaining.toLocaleString('es-AR')}</b> para <b>Envío Gratis</b>` : '<b style="color:#00a650;">¡Felicitaciones! Tienes Envío Gratis</b>';
        let color = remaining > 0 ? '#3498db' : '#00a650'; // ML style
        
        let progressBarHTML = `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="font-size: 0.95rem; color: var(--text-color); margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-truck-fast" style="color: ${color}; font-size:1.2rem;"></i> <span>${message}</span>
                </div>
                <div style="width: 100%; height: 10px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: ${color}; transition: width 0.5s ease; border-radius: 10px;"></div>
                </div>
            </div>
        `;
        cartItemsContainer.innerHTML += progressBarHTML;
    }

    cartTotalElement.innerText = `${window.formatPrice(total)}`;
}

// Renderizado para Checkout
async function renderCheckout() { await window.dolarPromise; 
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutTotal) return;

    let total = 0;
    checkoutItems.innerHTML = '';
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;
    
    if (isWholesale) {
        checkoutItems.innerHTML += `<div style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 15px;">
                        <i class="fa-solid fa-tags"></i> Precio Mayorista Aplicado
                      </div>`;
    }
    
    cart.forEach(item => {
        let finalPrice = item.price;
        if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
        total += finalPrice * item.quantity;
        
        checkoutItems.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; font-size: 0.9rem; color: var(--text-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <div style="display:flex; flex-direction:column;">
                    <strong>${item.quantity}x ${item.name}</strong>
                    ${item.variant_name ? `<span style="color:var(--text-muted); font-size:0.8rem;">${item.variant_name}</span>` : ''}
                </div>
                <div style="text-align: right;">
                    ${isWholesale ? `<span style="color: #ff4757; text-decoration:line-through; font-size: 0.8rem; display:block;">${window.formatPrice(item.price * item.quantity)}</span>` : ''}
                    <strong>${window.formatPrice(finalPrice * item.quantity)}</strong>
                </div>
            </div>
        `;
    });

    // Calcular envío extra
    let shippingCost = 0;
    var settings_ml = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    const threshold = settings_ml.free_shipping_threshold;
    
    // Si supera el umbral, envío gratis
    const isFreeShipping = threshold > 0 && total * window.dolarValue >= threshold;

    const zipInput = document.getElementById('chk-zip');
    const userZip = zipInput ? zipInput.value.trim() : '';
    
    const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
    let shippingName = 'Envío';
    
    if (selectedShipping) {
        shippingCost = parseFloat(selectedShipping.dataset.cost) || 0;
        shippingName = selectedShipping.dataset.name || 'Envío';
        
        // Envío local sin cargo
        if (userZip === '3283' || userZip === '3280' || userZip === '3265' || userZip === '3260') {
            shippingCost = 0;
            shippingName = 'Envío Local (Sin Cargo)';
        } else if (isFreeShipping) {
            shippingCost = 0;
            shippingName = 'Envío (Bonificado por Promoción)';
        }
        
        checkoutItems.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #ccc; font-size: 0.9rem; color: var(--text-color);">
                <span>${shippingName}</span>
                <span style="${shippingCost === 0 ? 'color:#555555; font-weight:bold;' : ''}">${shippingCost === 0 ? 'Gratis' : window.formatArs(shippingCost)}</span>
            </div>
        `;
    }

    
    
    var settings_ml = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    var thresholdARS = settings_ml.free_shipping_threshold;
    var currentTotalARS = total * window.dolarValue;
    
    if (thresholdARS > 0) {
        let percent = Math.min(100, Math.round((currentTotalARS / thresholdARS) * 100));
        let remaining = thresholdARS - currentTotalARS;
        
        let message = remaining > 0 ? `Te faltan <b style="color:var(--text-color); font-size:1rem;">${'$' + remaining.toLocaleString('es-AR')}</b> para <b>Envío Gratis</b>` : '<b style="color:#00a650;">¡Felicitaciones! Tienes Envío Gratis</b>';
        let color = remaining > 0 ? '#3498db' : '#00a650'; // ML style
        
        let progressBarHTML = `
            <div style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="font-size: 0.95rem; color: var(--text-color); margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-truck-fast" style="color: ${color}; font-size:1.2rem;"></i> <span>${message}</span>
                </div>
                <div style="width: 100%; height: 10px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: ${color}; transition: width 0.5s ease; border-radius: 10px;"></div>
                </div>
            </div>
        `;
        checkoutItems.innerHTML += progressBarHTML;
    }

    let finalDisplayTotal = total;
    let finalShipping = shippingCost;
    
    if (window.currentCoupon) {
        if (window.currentCoupon.type === 'percent') {
            const discount = finalDisplayTotal * (window.currentCoupon.value / 100);
            finalDisplayTotal -= discount;
            checkoutItems.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Descuento (${window.currentCoupon.value}%)</span>
                    <span>-${window.formatPrice(discount)}</span>
                </div>`;
        } else if (window.currentCoupon.type === 'fixed') {
            finalDisplayTotal -= window.currentCoupon.value;
            checkoutItems.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Descuento Fijo</span>
                    <span>-${window.formatPrice(window.currentCoupon.value)}</span>
                </div>`;
        } else if (window.currentCoupon.type === 'shipping') {
            finalShipping = 0;
            checkoutItems.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #2ecc71; font-weight: bold; font-size: 0.9rem;">
                    <span>Envío Bonificado (Cupón)</span>
                    <span>Gratis</span>
                </div>`;
        }
    }
    
    checkoutTotal.innerText = `${window.formatPrice(finalDisplayTotal + finalShipping)}`;

}

// Cargar productos desde Supabase vía nuestáo Backend Node.js
async function loadProductsFromDB() {
    const catalogContainer = document.getElementById('catalog-container');
    const offersContainer = document.getElementById('offers-container');
    
    if (!catalogContainer && !offersContainer) return;

        const drawSkeletons = (container, count) => {
        if (!container) return;
        container.innerHTML = Array(count).fill(`
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-title" style="width: 50%;"></div>
                <div class="skeleton-price"></div>
                <div class="skeleton-btn"></div>
            </div>
        `).join('');
    };
    if (catalogContainer) drawSkeletons(catalogContainer, 8);
    if (offersContainer) drawSkeletons(offersContainer, 4);
    
    try {
        await window.dolarPromise;
        const response = await fetch(window.API_URL + '/api/products');
        let products = await response.json();

        if (!response.ok) throw new Error(products.error || 'Error al cargar productos');

        // Mezclar aleatoriamente los productos para que no siempre salgan en el mismo orden
        products = products.sort(() => Math.random() - 0.5);

        if (catalogContainer) catalogContainer.innerHTML = '';
        if (offersContainer) offersContainer.innerHTML = '';

        if(products.length === 0) {
            if(catalogContainer) catalogContainer.innerHTML = '<p style="color: var(--text-muted); text-align:center; grid-column:1/-1;">No hay productos en la base de datos todavía.</p>';
            if(offersContainer) offersContainer.innerHTML = '<p style="color: var(--text-muted); text-align:center; grid-column:1/-1;">No hay ofertas disponibles.</p>';
            return;
        }

        let offersCount = 0;
        let catalogCount = 0;

        products.forEach(prod => {
            // Limitar a 4 ofertas aleatorias y 8 productos de catálogo aleatorios en el Home
            if (prod.is_offer && offersCount >= 4) return;
            if (!prod.is_offer && catalogCount >= 8) return;

            const priceFormatted = `${window.formatPrice(parseFloat(prod.price))}`;
            const oldPrice = parseFloat(prod.price) * 1.2; 
            const image = window.getFullImageUrl(prod.image_url) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

            
                const hasVariants = prod.variants && prod.variants.length > 0;
                let variantsHTML = '';
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    const uniqueBatts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);

                    variantsHTML = `<div class="card-variants" style="margin-bottom:1rem; display:flex; flex-direction:column; gap:6px; text-align:left;">`;
                    if (uniqueColors.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="color" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueColors.forEach(c => variantsHTML += `<option value="${c}">Color: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueCaps.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="capacity" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueCaps.forEach(c => variantsHTML += `<option value="${c}">Cap: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueRams.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="ram" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueRams.forEach(c => variantsHTML += `<option value="${c}">RAM: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueBatts.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="batt" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueBatts.forEach(c => variantsHTML += `<option value="${c}">Bat: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    variantsHTML += `<p class="card-variant-stock" style="font-size:0.8rem; font-weight:bold; margin:4px 0 0 0; color:#555; text-align:center;"></p></div>`;
                }

                const cardHTML = `
                    <div class="product-card ${prod.is_offer ? 'offer-card' : ''}" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="position:relative; display:flex; flex-direction:column; background: var(--card-bg); border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s;">
                        ${prod.stock <= 0 ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#333; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">AGOTADO</span>` : (typeof hasOffer !== 'undefined' && hasOffer ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-${typeof discount !== 'undefined' ? discount : 0}%</span>` : (prod.is_offer ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">OFERTA 🔥</span>` : ''))}
                        
                        ${typeof favIcon !== 'undefined' ? favIcon : ''}

                        <a href="producto.html?id=${prod.id}" class="product-img-wrapper">
                            <img src="${image}" alt="${prod.name}" class="product-img" style="max-width:100%;">
                        </a>
                        <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.3rem;">${prod.brand || 'PhoneSpot'}</p>
                        ${(() => {
                            let c = "Nuevo, Caja Sellada";
                            if (prod.description && prod.description.startsWith('[Condición: ')) {
                                const end = prod.description.indexOf(']');
                                if (end !== -1) c = prod.description.substring(12, end);
                            }
                            if (prod.variants && prod.variants.length > 0) {
                                const batts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);
                                if (batts.length > 0) {
                                    c += ' | Batería: ' + batts.join('/');
                                }
                            }
                            return `<span style="background: ${c.toLowerCase().includes('nuevo') ? '#e8f5e9' : '#fff3e0'}; color: ${c.toLowerCase().includes('nuevo') ? '#2e7d32' : '#e65100'}; border: 1px solid ${c.toLowerCase().includes('nuevo') ? '#a5d6a7' : '#ffcc80'}; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: bold; display: inline-block; margin-bottom: 0.5rem;">${c}</span>`;
                        })()}
                        <h4 style="margin: 0 0 1rem; font-size: 1.1rem; flex:1;"><a href="producto.html?id=${prod.id}" style="color: var(--text-color); text-decoration: none;">${prod.name}</a></h4>
                        
                        <div style="margin-bottom: 1.5rem;">
                            ${(typeof hasOffer !== 'undefined' && hasOffer) || prod.is_offer ? `<p style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem; margin: 0;">${window.formatPrice(Number(prod.old_price || prod.price*1.2))}</p>` : ''}
                            <p class="price card-price" style="color: var(--text-color); font-weight: 900; font-size: 1.4rem; margin: 0;">${window.formatPrice(Number(prod.price))}</p>
                        </div>
                        
                        ${variantsHTML}
                        
                        <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\'#111\'" onmouseout="this.style.background=\'#555555\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> ${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                        ${hasVariants ? `<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="display:none;" onload="window.updateCardVariant(this.previousElementSibling)" />` : ''}
                    </div>
                `;

            if (prod.is_offer && offersContainer) {
                offersContainer.innerHTML += cardHTML;
                offersCount++;
            } else if (catalogContainer) {
                catalogContainer.innerHTML += cardHTML;
                catalogCount++;
            }
        });
        if (window.initFadeObserver) window.initFadeObserver();

        // Si después de todo no hay ofertas, mostrar mensaje
        if(offersCount === 0 && offersContainer) {
            offersContainer.innerHTML = '<p style="color: var(--text-muted); text-align:center; grid-column:1/-1;">Hoy no hay ofertas relámpago. ¡íVuelve mañana!</p>';
        }
    } catch (err) {
        console.error("Error cargando productos:", err);
        if (catalogContainer) catalogContainer.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;"><b>ERROR DE CONEXIÓN AL SERVIDOR</b><br>Si ves esto en VIVO (phonespot.site), tienes un error en tus DNS (están apuntando a Cloudflare 1.1.1.1 en vez de a Railway).<br>Si ves esto en LOCAL, asegúrate de haber ejecutado <code>node server.js</code> y estar accediendo desde <code>localhost:3000</code> y NO desde un archivo local (file:///).</p>';
        showToast('Error de conexión a la API', 'fa-triangle-exclamation');
    }
}


window.getColorHex = (colorName) => {
    const name = colorName.toLowerCase().trim();
    if (name.includes('negro') || name.includes('black') || name.includes('oscuro')) return '#1e1e1e';
    if (name.includes('blanco') || name.includes('white') || name.includes('claro')) return '#f9f6ef';
    if (name.includes('plata') || name.includes('silver')) return '#e3e4e6';
    if (name.includes('gris') || name.includes('grey') || name.includes('gray')) return '#737373';
    if (name.includes('azul') || name.includes('blue')) return '#215e7c';
    if (name.includes('rojo') || name.includes('red')) return '#a50011';
    if (name.includes('rosa') || name.includes('pink')) return '#fcdbce';
    if (name.includes('oro') || name.includes('gold') || name.includes('dorado')) return '#f6e2ce';
    if (name.includes('titanio natural')) return '#b5b3a9';
    if (name.includes('titanio azul')) return '#383b40';
    if (name.includes('titanio blanco')) return '#e3e4e6';
    if (name.includes('titanio negro')) return '#222324';
    if (name.includes('verde') || name.includes('green')) return '#d0d9d2';
    if (name.includes('amarillo') || name.includes('yellow')) return '#fce473';
    if (name.includes('violeta') || name.includes('purple')) return '#d5c7d9';
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};


document.addEventListener('DOMContentLoaded', () => {

    const globalLogoutBtn = document.getElementById('logout-btn') || document.getElementById('btn-logout');
    if (globalLogoutBtn) {
        globalLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('phoneSpotToken');
            localStorage.removeItem('phoneSpotRole');
            window.location.href = 'index.html';
        });
    }

    updateCartCount();

    

    // Inyectar Side-Cart Global
    if (!document.getElementById('side-cart')) {
        const overlay = document.createElement('div');
        overlay.id = 'side-cart-overlay';
        
        const sideCart = document.createElement('div');
        sideCart.id = 'side-cart';
        sideCart.innerHTML = `
            <div class="side-cart-header">
                <h3>Tu Carrito</h3>
                <i class="fa-solid fa-xmark close-cart-btn" id="close-cart-btn"></i>
            </div>
            <div id="free-shipping-container" style="padding: 1rem 1.5rem; background: #fdfdfd; border-bottom: 1px solid var(--border-color);">
                <p id="free-shipping-text" style="margin: 0 0 0.5rem; font-size: 0.85rem; font-weight: bold; color: var(--text-color); text-align: center;"></p>
                <div style="width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                    <div id="free-shipping-bar" style="height: 100%; width: 0%; background: #555555; transition: width 0.3s ease;"></div>
                </div>
            </div>
            <div class="side-cart-body" id="side-cart-items">
                <!-- Items se inyectan acá -->
            </div>
            <div class="side-cart-footer">
                <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.2rem; margin-bottom:1rem;">
                    <span>Total:</span>
                    <span id="side-cart-total">$0</span>
                </div>
                <button onclick="window.goToCheckout(event)" class="btn btn-block" style="text-align:center; width:100%;"><i class="fa-solid fa-lock" style="margin-right:8px;"></i> Finalizar Compra</button>
                <a href="carrito.html" style="display:block; text-align:center; margin-top:1rem; font-size:0.9rem; color: var(--text-muted); text-decoration:underline;">Ver carrito completo</a>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(sideCart);

        // Lógica de apertura/cierre
        window.openSideCart = () => {
            document.getElementById('side-cart').classList.add('active');
            document.getElementById('side-cart-overlay').classList.add('active');
            renderSideCart();
        };
        const closeCart = () => {
            document.getElementById('side-cart').classList.remove('active');
            document.getElementById('side-cart-overlay').classList.remove('active');
        };
        document.getElementById('close-cart-btn').addEventListener('click', closeCart);
        overlay.addEventListener('click', closeCart);

        // Interceptar íconos del carrito del header para abrir el side-cart en vez de ir a la página
        const cartIcons = document.querySelectorAll('.cart-icon');
        cartIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                if(window.location.pathname.includes('carrito.html')) return; // En la pág de carrito no abrimos side-cart
                if(window.location.pathname.includes('checkout.html')) return; // En checkout tampoco
                e.preventDefault();
                window.openSideCart();
            });
        });
    }

    // Mení Hamburguesa Móvil
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const nav = document.querySelector('nav');
    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
    
    // Verificar estádo de Login en el ícono del header
    const userIconLink = document.getElementById('user-icon-link');
    if (userIconLink) {
        const role = localStorage.getItem('phoneSpotRole');
        const token = localStorage.getItem('phoneSpotToken');
        if (token) {
            if (role === 'admin') {
                userIconLink.href = 'admin.html';
                userIconLink.title = 'Panel de Control';
            } else {
                userIconLink.href = 'perfil.html';
                userIconLink.title = 'Mi Cuenta (Logueado)';
                // Si quieren desloguearse pueden hacerlo con un botón, por ahora evitamos que vuelvan al login
            }
        }
    }

    // Delegación de eventos para el botón "Añadir al carrito"
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            if(btn.disabled) return;
            e.preventDefault();
            const card = btn.closest('.product-card') || btn.closest('.product-details') || btn.closest('.hero-content');
            
            const id = card.dataset.id;
            let name = card.querySelector('h4, h2').innerText.split('.')[0]; 
            const price = parseFloat(card.dataset.price);

            // Verificar si hay una variante seleccionada
            let selectedVariant = card.dataset.selectedVariant || '';
            
            const activeColor = card.querySelector('.var-btn.active[data-type="color"]');
            const activeCap = card.querySelector('.var-btn.active[data-type="capacity"]');
            const activeRam = card.querySelector('.var-btn.active[data-type="ram"]');

            const activeBatt = card.querySelector('.var-btn.active[data-type="batt"]');
            
            const selColorBtn = card.querySelector('.variant-color-btn.selected');
            const selCapBtn = card.querySelector('.variant-cap-btn.selected');
            const selRamBtn = card.querySelector('.variant-ram-btn.selected');
            // Assuming no legacy selected batt buttons for old logic
            
            let color = '', cap = '', ram = '', batt = '';

            if (activeColor || activeCap || activeRam || activeBatt) {
                color = activeColor ? activeColor.dataset.val : '';
                cap = activeCap ? activeCap.dataset.val : '';
                ram = activeRam ? activeRam.dataset.val : '';
                batt = activeBatt ? activeBatt.dataset.val : '';
            } else if (selColorBtn || selCapBtn || selRamBtn) {
                color = selColorBtn ? selColorBtn.dataset.color : '';
                cap = selCapBtn ? selCapBtn.dataset.cap : '';
                ram = selRamBtn ? selRamBtn.dataset.ram : '';
            }
            
            if (color || cap || ram || batt) {
                selectedVariant = [color, cap, ram, batt ? 'Bat: '+batt : ''].filter(Boolean).join(' - ');
            }
            if (selectedVariant) {
                name = `${name} (${selectedVariant})`; 
            }
            
            let imgEl = card.querySelector('img:not([style*="display:none"])') || card.querySelector('img');
            const img = imgEl ? imgEl.src : '';
            
            // Evaluar stock y precio máximo
            let maxStock = 1; // Fallback
            let finalPrice = price;
            try {
                if (card.dataset.stockInfo) {
                    const info = JSON.parse(unescape(card.dataset.stockInfo));
                    if (selectedVariant && info.variants && info.variants.length > 0) {
                        const v = info.variants.find(vx => {
                            const vName = [vx.color, vx.capacity, vx.ram, vx.batt ? 'Bat: '+vx.batt : ''].filter(Boolean).join(' - ');
                            return vName === selectedVariant;
                        });
                        if (v) {
                            maxStock = v.stock;
                            if (v.price) finalPrice = parseFloat(v.price);
                        } else {
                            maxStock = 0;
                        }
                    } else {
                        maxStock = info.stock;
                    }
                }
            } catch(e) {
                console.error('Error parsing stock info', e);
            }

            addToCart({id, name, price: finalPrice, img, variant_name: selectedVariant || null, maxStock});
        }
    });

    // Lógica para página de Catálogo (catálogo.html)
    
    const fullCatalogContainer = document.getElementById('full-catalog-container');
    if (fullCatalogContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const initialCat = urlParams.get('cat') || 'all';

        let allCatalogProducts = [];
        let selectedConditions = []; let selectedColors = [];
        let selectedBrands = initialCat !== 'all' && ['apple','samsung','motorola','xiaomi'].includes(initialCat) ? [initialCat] : [];
        let selectedCategories = initialCat !== 'all' && ['celulares','notebooks','tablets','accesorios'].includes(initialCat) ? [initialCat] : [];
                
        let onlyOffers = false;
        let currentSort = '';

        // UI Elements
                        const sortFilter = document.getElementById('sort-filter');
        const brandFiltersContainer = document.getElementById('brand-filters');
        const countLabel = document.getElementById('catalog-count-label');

        const renderFilteredCatalog = () => {
            if(!allCatalogProducts.length) return;

            let filtered = allCatalogProducts.filter(p => {
                // Category Filter
                if (selectedCategories.length > 0) {
                    const str = (p.name + " " + p.description + " " + p.category).toLowerCase();
                    const matchesCat = selectedCategories.some(cat => str.includes(cat));
                    if (!matchesCat) return false;
                }

                // Brand Filter
                if (selectedBrands.length > 0) {
                    const b = (p.brand || '').trim().toLowerCase();
                    if (!selectedBrands.includes(b)) return false;
                }

                
                // Conditions Filter
                if (selectedConditions.length > 0) {
                    const desc = (p.description || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const combined = name + " " + desc;
                    
                    let isSwap = combined.includes('swap') || combined.includes('americano') || combined.includes('usado') || combined.includes('seminuevo');
                    let isReac = combined.includes('reacondicionado') || combined.includes('refurbished');
                    let isNuevo = !isSwap && !isReac;

                    let matchesCond = false;
                    if (selectedConditions.includes('nuevo') && isNuevo) matchesCond = true;
                    if (selectedConditions.includes('swap_americano') && isSwap) matchesCond = true;
                    if (selectedConditions.includes('reacondicionado') && isReac) matchesCond = true;
                    
                    if (!matchesCond) return false;
                }

                // Colors Filter
                if (selectedColors.length > 0) {
                    const desc = (p.description || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const combined = name + " " + desc;
                    
                    // Simple color matching based on text
                    let matchesColor = selectedColors.some(color => {
                        if (color === 'negro' && (combined.includes('negro') || combined.includes('black') || combined.includes('oscuro') || combined.includes('midnight'))) return true;
                        if (color === 'blanco' && (combined.includes('blanco') || combined.includes('white') || combined.includes('plata') || combined.includes('silver') || combined.includes('starlight'))) return true;
                        if (color === 'azul' && (combined.includes('azul') || combined.includes('blue') || combined.includes('cyan'))) return true;
                        if (color === 'titanium' && (combined.includes('titanium') || combined.includes('titanio') || combined.includes('gris') || combined.includes('gray') || combined.includes('grey'))) return true;
                        return combined.includes(color);
                    });
                    
                    if (!matchesColor) return false;
                }

                // Price Filter
                
                // Offers Filter
                if (onlyOffers && !p.is_offer) {
                    return false;
                }

                

                return true;
            });

            // Sort
            if (currentSort === 'price-asc') filtered.sort((a,b) => Number(a.price) - Number(b.price));
            if (currentSort === 'price-desc') filtered.sort((a,b) => Number(b.price) - Number(a.price));

            // Update UI count
            if (countLabel) {
                countLabel.innerText = 'Mostrando ' + filtered.length + ' producto' + (filtered.length === 1 ? '' : 's');
            }

            fullCatalogContainer.innerHTML = '';
            if (filtered.length === 0) {
                fullCatalogContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 1.2rem; margin-top: 2rem;">No se encontraron productos con estos filtros.</p>';
                return;
            }

            filtered.forEach(prod => {
                const image = window.getFullImageUrl(prod.image_url) || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                const hasOffer = prod.old_price && Number(prod.old_price) > Number(prod.price);
                const discount = hasOffer ? Math.round((1 - (Number(prod.price)/Number(prod.old_price))) * 100) : 0;
                
                // Build Fav Icon
                const favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
                const isActive = favs.includes(prod.id.toString()) ? 'active' : '';
                const favIcon = `<button class="fav-btn ${isActive}" data-id="${prod.id}" onclick="window.toggleFavorite('${prod.id}', event)" style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); border:none; width:35px; height:35px; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.1); cursor:pointer; color: ${isActive ? '#ff4757' : '#ccc'}; transition: 0.3s; z-index:10;"><i class="fa-solid fa-heart"></i></button>`;

                
                const hasVariants = prod.variants && prod.variants.length > 0;
                let variantsHTML = '';
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    const uniqueBatts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);

                    variantsHTML = `<div class="card-variants" style="margin-bottom:1rem; display:flex; flex-direction:column; gap:6px; text-align:left;">`;
                    if (uniqueColors.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="color" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueColors.forEach(c => variantsHTML += `<option value="${c}">Color: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueCaps.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="capacity" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueCaps.forEach(c => variantsHTML += `<option value="${c}">Cap: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueRams.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="ram" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueRams.forEach(c => variantsHTML += `<option value="${c}">RAM: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    if (uniqueBatts.length > 0) {
                        variantsHTML += `<select class="var-select" data-type="batt" style="padding:6px; border-radius:6px; border:1px solid #ddd; font-size:0.85rem; outline:none; background:#f9f9f9; color:#333;" onchange="window.updateCardVariant(this)">`;
                        uniqueBatts.forEach(c => variantsHTML += `<option value="${c}">Bat: ${c}</option>`);
                        variantsHTML += `</select>`;
                    }
                    variantsHTML += `<p class="card-variant-stock" style="font-size:0.8rem; font-weight:bold; margin:4px 0 0 0; color:#555; text-align:center;"></p></div>`;
                }

                const cardHTML = `
                    <div class="product-card ${prod.is_offer ? 'offer-card' : ''}" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="position:relative; display:flex; flex-direction:column; background: var(--card-bg); border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s;">
                        ${prod.stock <= 0 ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#333; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">AGOTADO</span>` : (typeof hasOffer !== 'undefined' && hasOffer ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-${typeof discount !== 'undefined' ? discount : 0}%</span>` : (prod.is_offer ? `<span class="badge card-main-badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">OFERTA 🔥</span>` : ''))}
                        
                        ${typeof favIcon !== 'undefined' ? favIcon : ''}

                        <a href="producto.html?id=${prod.id}" class="product-img-wrapper">
                            <img src="${image}" alt="${prod.name}" class="product-img" style="max-width:100%;">
                        </a>
                        <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.3rem;">${prod.brand || 'PhoneSpot'}</p>
                        ${(() => {
                            let c = "Nuevo, Caja Sellada";
                            if (prod.description && prod.description.startsWith('[Condición: ')) {
                                const end = prod.description.indexOf(']');
                                if (end !== -1) c = prod.description.substring(12, end);
                            }
                            if (prod.variants && prod.variants.length > 0) {
                                const batts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);
                                if (batts.length > 0) {
                                    c += ' | Batería: ' + batts.join('/');
                                }
                            }
                            return `<span style="background: ${c.toLowerCase().includes('nuevo') ? '#e8f5e9' : '#fff3e0'}; color: ${c.toLowerCase().includes('nuevo') ? '#2e7d32' : '#e65100'}; border: 1px solid ${c.toLowerCase().includes('nuevo') ? '#a5d6a7' : '#ffcc80'}; font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; font-weight: bold; display: inline-block; margin-bottom: 0.5rem;">${c}</span>`;
                        })()}
                        <h4 style="margin: 0 0 1rem; font-size: 1.1rem; flex:1;"><a href="producto.html?id=${prod.id}" style="color: var(--text-color); text-decoration: none;">${prod.name}</a></h4>
                        
                        <div style="margin-bottom: 1.5rem;">
                            ${(typeof hasOffer !== 'undefined' && hasOffer) || prod.is_offer ? `<p style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem; margin: 0;">${window.formatPrice(Number(prod.old_price || prod.price*1.2))}</p>` : ''}
                            <p class="price card-price" style="color: var(--text-color); font-weight: 900; font-size: 1.4rem; margin: 0;">${window.formatPrice(Number(prod.price))}</p>
                        </div>
                        
                        ${variantsHTML}
                        
                        <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\'#111\'" onmouseout="this.style.background=\'#555555\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> ${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                        ${hasVariants ? `<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" style="display:none;" onload="window.updateCardVariant(this.previousElementSibling)" />` : ''}
                    </div>
                `;
                fullCatalogContainer.innerHTML += cardHTML;
            });
        };

        window.dolarPromise.then(() => fetch(window.API_URL + '/api/products')).then(res => res.json())
            .then(products => {
                allCatalogProducts = products;

                // Build dynamic brands
                let availableBrands = [];
                if (window.phoneSpotSettings && window.phoneSpotSettings.brands_list) {
                    availableBrands = window.phoneSpotSettings.brands_list.split(',').map(b => b.trim()).filter(b => b);
                } else {
                    availableBrands = [...new Set(products.map(p => (p.brand||'').trim()).filter(b => b))].sort();
                }
                
                if (brandFiltersContainer) {
                    brandFiltersContainer.innerHTML = '';
                    availableBrands.forEach(b => {
                        const isChecked = selectedBrands.includes(b.toLowerCase()) ? 'checked' : '';
                        brandFiltersContainer.innerHTML += `
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--text-color);">
                                <input type="checkbox" value="${b.toLowerCase()}" class="brand-checkbox" ${isChecked} style="accent-color: #555555; width: 18px; height: 18px;">
                                ${b}
                            </label>
                        `;
                    });

                    // Wiring existing Americanos filter from HTML
                    const offerFilter = document.getElementById('offer-filter');
                    if (offerFilter) {
                        offerFilter.addEventListener('change', (e) => {
                            onlyOffers = e.target.checked;
                            renderFilteredCatalog();
                        });
                    }

                    

                    // Check initial category boxes based on URL
                    document.querySelectorAll('.cat-checkbox').forEach(chk => {
                        if (selectedCategories.includes(chk.value)) chk.checked = true;
                        
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedCategories.push(e.target.value);
                            else selectedCategories = selectedCategories.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });

                    // Attach Event Listeners to brand checkboxes
                    document.querySelectorAll('.brand-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedBrands.push(e.target.value);
                            else selectedBrands = selectedBrands.filter(b => b !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });
                
                    document.querySelectorAll('.cond-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedConditions.push(e.target.value);
                            else selectedConditions = selectedConditions.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });

                    document.querySelectorAll('.color-checkbox').forEach(chk => {
                        chk.addEventListener('change', (e) => {
                            if(e.target.checked) selectedColors.push(e.target.value);
                            else selectedColors = selectedColors.filter(c => c !== e.target.value);
                            renderFilteredCatalog();
                        });
                    });
                    
                    // Enforce mobile closed by default programmatically
                    if(window.innerWidth <= 768) {
                        document.querySelectorAll('#filters-sidebar details').forEach(d => d.removeAttribute('open'));
                    }
}

                // Attach Event Listener to Price Slider
                
                // Attach Event Listener to Sort
                if (sortFilter) {
                    sortFilter.addEventListener('change', (e) => {
                        currentSort = e.target.value;
                        renderFilteredCatalog();
                    });
                }

                renderFilteredCatalog();
            })
            .catch(err => {
                fullCatalogContainer.innerHTML = '<p>Error al cargar el catálogo.</p>';
            });
    }

// Lógica para Detalles de un Solo Producto (producto.html)
    const singleProductContainer = document.getElementById('single-product-container');
    if (singleProductContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            singleProductContainer.innerHTML = '<p style="color:#ff4757; font-size:1.2rem;">Producto no encontrado (Falta ID).</p>';
        } else {
            Promise.all([
                window.dolarPromise,
                fetch(`${window.API_URL}/api/products/${productId}`).then(r => r.json()),
                fetch(`${window.API_URL}/api/reviews/${productId}`).then(r => r.json()).catch(() => [])
            ]).then(([_, prod, reviews]) => {
                if (prod.error) {
                    singleProductContainer.innerHTML = `<p style="color:#ff4757; font-size:1.2rem;">${prod.error}</p>`;
                    return;
                }
                
                document.title = `${prod.name} | PhoneSpot`;
                window.trackStoreEvent('product_view', { productId: prod.id });
                const image = window.getFullImageUrl(prod.image_url) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
                const isOutOfStock = prod.stock <= 0;
                const oldPrice = prod.is_offer ? `<p class="old-price" style="text-decoration:line-through; color: var(--text-muted); margin-bottom:0;">${window.formatPrice(prod.price * 1.2)}</p>` : '';

                let variantsHTML = '';
                let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    const uniqueBatts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);
                    
                    variantsHTML = `
                        <style>
                            .var-btn:hover { border-color: #999 !important; }
                            .var-btn.active { border-color: #0071e3 !important; }
                        </style>
                        <div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">
                            ${uniqueColors.length > 0 ? `
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Color - <span id="selected-color-name" style="color: #666; font-weight: 500;">${uniqueColors[0]}</span></h4>
                                <div style="display:flex; flex-wrap:wrap; gap:12px;" id="color-opts">
                                    ${uniqueColors.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="color" data-val="${c}" title="${c}" onclick="document.getElementById(\'selected-color-name\').innerText=\'${c}\';" style="width:42px; height:42px; border-radius:50%; padding:3px; background:transparent; border: 2px solid ${i===0?'#0071e3':'#e5e5ea'}; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;"><div style="width:100%; height:100%; border-radius:50%; background:${window.getColorHex(c)}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"></div></button>`).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${uniqueCaps.length > 0 ? `
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Almacenamiento</h4>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;" id="cap-opts">
                                    ${uniqueCaps.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="capacity" data-val="${c}" style="padding:22px 10px; background:#fff; border: 2px solid ${i===0?'#0071e3':'#e5e5ea'}; border-radius:18px; font-weight:700; font-size:1.1rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; text-align:center;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${uniqueRams.length > 0 ? `
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Memoria RAM</h4>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;" id="ram-opts">
                                    ${uniqueRams.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="ram" data-val="${c}" style="padding:22px 10px; background:#fff; border: 2px solid ${i===0?'#0071e3':'#e5e5ea'}; border-radius:18px; font-weight:700; font-size:1.1rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; text-align:center;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${uniqueBatts.length > 0 ? `
                            <div style="margin-bottom:2rem;">
                                <h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Condición de Batería</h4>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;" id="batt-opts">
                                    ${uniqueBatts.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="batt" data-val="${c}" style="padding:15px 10px; background:#fff; border: 2px solid ${i===0?'#0071e3':'#e5e5ea'}; border-radius:12px; font-weight:700; font-size:1rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; text-align:center;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}
                            
                            <p id="variant-stock-msg" style="font-size:0.95rem; margin-top:0.5rem; font-weight:bold;"></p>
                        </div>
                    `;
                }

                // Parsear condición de la descripción
                let prodCondition = "Nuevo, Caja Sellada";
                let displayDesc = prod.description || '';
                if (displayDesc.startsWith('[Condición: ')) {
                    const endIdx = displayDesc.indexOf(']');
                    if (endIdx !== -1) {
                        prodCondition = displayDesc.substring(12, endIdx);
                        displayDesc = displayDesc.substring(endIdx + 1).trim();
                    }
                }
                if (prod.variants && prod.variants.length > 0) {
                    const batts = [...new Set(prod.variants.map(v => v.batt))].filter(Boolean);
                    if (batts.length > 0) {
                        prodCondition += ' | Batería: ' + batts.join('/');
                    }
                }

                const reviewsHtml = Array.isArray(reviews) && reviews.length > 0
                    ? reviews.map((review) => `
                        <article style="padding:1rem 0; border-top:1px solid #eee;">
                            <strong>${escapeText(review.user_name || 'Cliente')}</strong>
                            <span style="color:#f5a623; margin-left:0.5rem;">${'★'.repeat(Math.min(5, Math.max(1, Number(review.rating) || 5)))}</span>
                            <p style="margin:0.5rem 0 0; color:#555; line-height:1.5;">${escapeText(review.comment)}</p>
                        </article>`).join('')
                    : '<p style="color:var(--text-muted);">Todavía no hay reseñas para este producto.</p>';

                singleProductContainer.innerHTML = `
                    <div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">
                        <div class="product-details" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" >
                            <div class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="position: relative; overflow: hidden; border-radius: 16px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                                    ${prod.stock <= 0 ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#333; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">AGOTADO</div>` : (prod.is_offer ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>` : '')}
                                    <img id="main-product-img" src="${image}" alt="${prod.name}" style="width:90%; display:block; transition: transform 0.4s ease; cursor: zoom-in; mix-blend-mode: multiply;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onmousemove="const rect=this.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;this.style.transformOrigin=(x*100) + '%' + ' ' + (y*100) + '%';">
                                </div>
                                <div class="gallery-thumbnails" style="display: flex; gap: 10px; justify-content: center;">
                                    <img src="${image}" class="gallery-thumb active" style="width:70px; height:70px; object-fit:contain; border-radius:10px; cursor:pointer; padding:5px; background:#f5f5f7; border:2px solid #000;" onclick="document.getElementById('main-product-img').src=this.src;">
                                </div>
                            </div>
                            
                            <div class="product-info" style="display:flex; flex-direction:column; justify-content:flex-start;">
                                <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 0.8rem;">
                                    <span style="background: #e3e3e3; color: #333; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">${prod.brand}</span>
                                    <span style="color: var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">${prod.category}</span>
                                </div>
                                
                                <h2 style="font-size:2.4rem; font-weight:800; line-height:1.1; margin-bottom:1rem; color: #1d1d1f; letter-spacing:-0.5px;">${prod.name}</h2>
                                
                                <div class="product-condition-tag" style="margin-bottom: 1.5rem; font-size: 0.9rem; display: flex; align-items: center;">
                                    <span style="background: ${prodCondition.toLowerCase().includes('nuevo') ? '#e8f5e9' : '#fff3e0'}; color: ${prodCondition.toLowerCase().includes('nuevo') ? '#2e7d32' : '#e65100'}; border: 1px solid ${prodCondition.toLowerCase().includes('nuevo') ? '#a5d6a7' : '#ffcc80'}; padding: 4px 12px; border-radius: 20px; font-weight: 600; display: inline-block;">
                                        <i class="fa-solid ${prodCondition.toLowerCase().includes('nuevo') ? 'fa-box' : 'fa-mobile-screen'}"></i> ${prodCondition}
                                    </span>
                                </div>
                                
                                
                                
                                <div style="margin-bottom:1.5rem;">
                                    ${!hasVariants ? `<p style="font-size:0.95rem; font-weight:bold; color: ${prod.stock > 0 ? '#2ecc71' : '#ff4757'};"><i class="fa-solid ${prod.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${prod.stock > 0 ? 'Stock disponible: ' + prod.stock + ' unidades' : 'Sin stock'}</p>` : ''}
                                </div>

                                ${variantsHTML}

                                <!-- Calculador de Envíos Moderno -->
                                <div style="background: #fff; padding: 1.2rem; border-radius: 12px; border: 1px solid #e0e0e0; margin-bottom: 1.5rem; display:flex; flex-direction:column; gap:0.8rem; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                                    <h4 style="font-size: 0.95rem; margin:0; color:#1d1d1f; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-truck-fast" style="color:#0071e3;"></i> Conocer tiempos y costos de envío</h4>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="text" id="calc-zip" placeholder="Tu CP (Ej: 3283)" style="flex: 1; padding: 0.7rem; border: 1px solid #ccc; border-radius: 8px; font-size:0.9rem; outline:none; transition:0.2s;" onfocus="this.style.borderColor='#0071e3'" onblur="this.style.borderColor='#ccc'">
                                        <button id="calc-btn" style="padding: 0.7rem 1.2rem; background:#f5f5f7; color:#1d1d1f; border:none; border-radius:8px; font-weight:bold; cursor:pointer; transition:0.2s;" onmouseover="this.style.background='#e8e8ed'" onmouseout="this.style.background='#f5f5f7'">Calcular</button>
                                    </div>
                                    <p id="zip-msg" style="margin: 0; font-size: 0.85rem; color: #555; display: none; line-height:1.4;"></p>
                                </div>
                                
                                
                                <div style="background:#f9f9f9; padding: 1.2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #eee;">
                                    ${prod.is_offer ? `<p class="old-price" style="text-decoration:line-through; color: var(--text-muted); margin-bottom:0;">${window.formatPrice(prod.price * 1.2)}</p>` : ''}
                                    <p class="price" id="dynamic-price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">${window.formatPrice(Number(prod.price))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span></p>
                                </div>
                                <div style="display:flex; gap:1rem; align-items:center; margin-bottom: 2rem;">
                                    <button class="btn add-to-cart-btn" style="flex:1; padding:1.2rem; font-size:1.1rem; font-weight:600; border-radius:12px; ${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}" ${isOutOfStock ? 'disabled' : ''}>
                                        <i class="fa-solid ${isOutOfStock ? 'fa-box-open' : 'fa-cart-plus'}"></i> ${isOutOfStock ? 'Sin Stock' : 'Añadir al carrito'}
                                    </button>
                                </div>

                                ${isOutOfStock ? `
                                    <form id="stock-alert-form" data-product-id="${prod.id}" style="margin:-0.8rem 0 2rem; padding:1rem; border:1px solid #e1e1e1; border-radius:12px; background:#fafafa;">
                                        <strong style="display:block; margin-bottom:.35rem;"><i class="fa-regular fa-bell"></i> ¿Querés que te avisemos cuando ingrese?</strong>
                                        <p style="margin:0 0 .75rem; color:#666; font-size:.88rem;">Dejanos tu email y te avisamos apenas vuelva a estar disponible.</p>
                                        <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
                                            <input id="stock-alert-email" type="email" required placeholder="tu@email.com" style="flex:1; min-width:190px; padding:.75rem; border:1px solid #ddd; border-radius:8px; font:inherit;">
                                            <button type="submit" class="btn" style="padding:.75rem 1rem;"><i class="fa-regular fa-bell"></i> Avisarme</button>
                                        </div>
                                    </form>
                                ` : ''}

                                <div style="padding-top: 1.5rem; border-top: 1px solid #eee;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 1rem; color:#1d1d1f;">Descripción del producto</h4>
                                    <p style="line-height:1.7; color: #555; font-size:0.95rem;">${displayDesc.replace(/\n/g, '<br>')}</p>
                                </div>

                                <section style="padding-top:1.5rem; margin-top:1.5rem; border-top:1px solid #eee;">
                                    <h4 style="font-size:0.95rem; margin-bottom:0.8rem; color:#1d1d1f;">Reseñas</h4>
                                    ${reviewsHtml}
                                    <form id="review-form" style="margin-top:1rem; display:grid; gap:0.7rem;">
                                        <label style="font-size:0.85rem; font-weight:600;">Tu calificación
                                            <select name="rating" style="margin-left:0.5rem; padding:0.35rem; border-radius:6px; border:1px solid #ddd;">
                                                <option value="5">5 estrellas</option>
                                                <option value="4">4 estrellas</option>
                                                <option value="3">3 estrellas</option>
                                                <option value="2">2 estrellas</option>
                                                <option value="1">1 estrella</option>
                                            </select>
                                        </label>
                                        <textarea name="comment" required minlength="2" maxlength="2000" rows="3" placeholder="Comparte tu experiencia con este producto" style="resize:vertical; padding:0.7rem; border:1px solid #ddd; border-radius:8px; font:inherit;"></textarea>
                                        <button type="submit" class="btn" style="justify-self:start;">Publicar reseña</button>
                                    </form>
                                </section>

                                <div style="margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border-radius: 12px; display:flex; flex-direction:column; gap:0.8rem;">
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-truck-fast" style="color:#0071e3;"></i></div>
                                        <span><strong>Envío inmediato</strong> a todo el país</span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-headset" style="color:#0071e3;"></i></div>
                                        <span><strong>Atención personalizada</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                    reviewForm.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        const token = localStorage.getItem('phoneSpotToken');
                        if (!token) return showToast('Inicia sesión para dejar una reseña.', 'fa-user');
                        const rating = Number(reviewForm.querySelector('[name="rating"]').value);
                        const comment = reviewForm.querySelector('[name="comment"]').value.trim();
                        try {
                            const response = await fetch(window.API_URL + '/api/reviews', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ product_id: prod.id, rating, comment })
                            });
                            const result = await response.json();
                            if (!response.ok) throw new Error(result.error || 'No se pudo guardar la reseña');
                            showToast('¡Gracias por tu reseña!', 'fa-check');
                            window.location.reload();
                        } catch (error) {
                            showToast(error.message, 'fa-triangle-exclamation');
                        }
                    });
                }

                // AHORA SÍ CONECTAMOS LOS EVENTOS, DESPUÉS DE INNER HTML
                if (hasVariants) {
                    window.checkVariantStock = (prodArg) => {
                        let colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        let capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        let ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        let battBtn = document.querySelector('.var-btn.active[data-type="batt"]');
                        
                        let selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        let selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        let selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;
                        let selectedBatt = battBtn ? battBtn.getAttribute('data-val') : null;

                        let variants = [];
                        if (prodArg.variants && Array.isArray(prodArg.variants)) variants = prodArg.variants;

                        // 1. Filtrar Capacidades basadas en el Color seleccionado
                        if (selectedColor) {
                            const validCaps = variants.filter(v => v.color === selectedColor).map(v => v.capacity);
                            document.querySelectorAll('.var-btn[data-type="capacity"]').forEach(btn => {
                                const val = btn.getAttribute('data-val');
                                if (!validCaps.includes(val)) {
                                    btn.style.opacity = '0.3';
                                    btn.style.pointerEvents = 'none';
                                    btn.style.textDecoration = 'line-through';
                                    if (selectedCap === val) selectedCap = null;
                                } else {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.textDecoration = 'none';
                                }
                            });
                        }
                        
                        // Auto-seleccionar capacidad si quedó vacía
                        if (!selectedCap) {
                            const firstValid = Array.from(document.querySelectorAll('.var-btn[data-type="capacity"]')).find(b => b.style.pointerEvents !== 'none');
                            if (firstValid) {
                                document.querySelectorAll('.var-btn[data-type="capacity"]').forEach(el => {
                                    el.classList.remove('active');
                                    el.style.borderColor = '#e5e5ea';
                                    el.style.background = '#fff';
                                });
                                firstValid.classList.add('active');
                                firstValid.style.borderColor = '#0071e3';
                                firstValid.style.background = '#fff';
                                selectedCap = firstValid.getAttribute('data-val');
                            }
                        }

                        // 2. Filtrar RAM basada en Color y Capacidad seleccionados
                        if (selectedColor && selectedCap) {
                            const validRams = variants.filter(v => v.color === selectedColor && v.capacity === selectedCap).map(v => v.ram);
                            document.querySelectorAll('.var-btn[data-type="ram"]').forEach(btn => {
                                const val = btn.getAttribute('data-val');
                                if (!validRams.includes(val)) {
                                    btn.style.opacity = '0.3';
                                    btn.style.pointerEvents = 'none';
                                    btn.style.textDecoration = 'line-through';
                                    if (selectedRam === val) selectedRam = null;
                                } else {
                                    btn.style.opacity = '1';
                                    btn.style.pointerEvents = 'auto';
                                    btn.style.textDecoration = 'none';
                                }
                            });
                        }

                        // Auto-seleccionar RAM si quedó vacía
                        if (!selectedRam) {
                            const firstValid = Array.from(document.querySelectorAll('.var-btn[data-type="ram"]')).find(b => b.style.pointerEvents !== 'none');
                            if (firstValid) {
                                document.querySelectorAll('.var-btn[data-type="ram"]').forEach(el => {
                                    el.classList.remove('active');
                                    el.style.borderColor = '#e5e5ea';
                                    el.style.background = '#fff';
                                });
                                firstValid.classList.add('active');
                                firstValid.style.borderColor = '#0071e3';
                                firstValid.style.background = '#fff';
                                selectedRam = firstValid.getAttribute('data-val');
                            }
                        }

                        // 3. Buscar el stock real de la combinación ganadora
                        let stockToUse = prodArg.stock;
                        let priceToUse = prodArg.price; // Start with base price
                        if (variants.length > 0) {
                            const v = variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam) &&
                                (!selectedBatt || x.batt === selectedBatt)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                if (v.price && !isNaN(parseFloat(v.price))) priceToUse = parseFloat(v.price);
                            } else {
                                stockToUse = 0;
                            }
                        }

                        // 4. Actualizar Botones y Textos
                        const btn = document.querySelector('.add-to-cart-btn');
                        const stockLabel = document.getElementById('variant-stock-msg');
                        
                        if (stockToUse <= 0) {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Sin Stock de este color/modelo';
                                btn.disabled = true;
                                btn.style.background = '#ccc';
                                btn.style.cursor = 'not-allowed';
                            }
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#ff4757;"><i class="fa-solid fa-times-circle"></i> Agotado en esta combinación</span>';
                        } else {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Añadir al carrito';
                                btn.disabled = false;
                                btn.style.background = '#0071e3'; 
                                btn.style.cursor = 'pointer';
                            }
                            if (stockLabel) stockLabel.innerHTML = `<span style="color:#2ecc71;"><i class="fa-solid fa-check-circle"></i> Stock disponible: ${stockToUse} unidades</span>`;
                            const container = document.querySelector('.product-details');
                            if (container) container.dataset.price = priceToUse;
                            const priceEl = document.getElementById('dynamic-price');
                            if (priceEl) priceEl.innerHTML = `${window.formatPrice(Number(priceToUse))} <span style="font-size:0.9rem; color:#888; font-weight:normal; letter-spacing:0;">/ Final ARS</span>`;
                        }
                    };

                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const targetBtn = e.target.closest('.var-btn');
                            if (!targetBtn) return;
                            const type = targetBtn.getAttribute('data-type');
                            
                            document.querySelectorAll(`.var-btn[data-type="${type}"]`).forEach(el => {
                                el.classList.remove('active');
                                el.style.borderColor = '#e5e5ea';
                                if (type !== 'color') el.style.background = '#fff';
                            });
                            
                            targetBtn.classList.add('active');
                            targetBtn.style.borderColor = '#0071e3';
                            if (type !== 'color') targetBtn.style.background = '#fff';
                            
                            window.checkVariantStock(prod);
                        });
                    });
                    
                    window.checkVariantStock(prod);
                }

                // Lógica Calculador Zip Code
                const calcBtn = document.getElementById('calc-btn');
                const calcZip = document.getElementById('calc-zip');
                const zipMsg = document.getElementById('zip-msg');
                if (calcBtn && calcZip && zipMsg) {
                    calcBtn.addEventListener('click', async () => {
                        const zip = calcZip.value.trim();
                        if (!/^\d{4,5}$/.test(zip)) {
                            zipMsg.style.display = 'block';
                            zipMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Ingresa un código postal válido.';
                            return;
                        }
                        
                        zipMsg.style.display = 'block';
                        zipMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';
                        try {
                            const response = await fetch(window.API_URL + '/api/shipping/quote', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ zip_code: zip })
                            });
                            const data = await response.json();
                            if (!response.ok || !data.success || !Array.isArray(data.options)) throw new Error(data.error || 'No pudimos calcular el envío');
                            const freeThreshold = (window.phoneSpotSettings && window.phoneSpotSettings.free_shipping_threshold) || 1500000;
                            if (Number(prod.price) * window.dolarValue >= freeThreshold) {
                                zipMsg.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#555555;"></i> ¡Envío GRATIS a tu código postal!';
                            } else {
                                zipMsg.innerHTML = data.options.map((option) => `<i class="fa-solid fa-truck"></i> ${escapeText(option.name)}: <strong>${option.cost === 0 ? 'Gratis' : window.formatArs(option.cost)}</strong> (${escapeText(option.time)})`).join('<br>');
                            }
                        } catch (error) {
                            zipMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeText(error.message)}`;
                        }
                    });
                }

                loadRelatedProducts(prod.id, prod.category);
            })
            .catch(err => {
                singleProductContainer.innerHTML = '<p style="color:#ff4757; font-size:1.2rem;">Error al cargar el producto.</p>';
            });
        }
    }
    function loadRelatedProducts(currentId, category) {
        Promise.all([window.dolarPromise, fetch(window.API_URL + '/api/products').then(res => res.json())])
            .then(([_, prods]) => {
                const section = document.getElementById('related-products-section');
                const container = document.getElementById('related-products-container');
                if (!section || !container) return;

                // Filtrar mismás productos o diferentes categorías (preferimás misma categoría)
                let related = prods.filter(p => p.id !== currentId && p.category === category);
                if (related.length < 4) {
                    // Rellenar con otros si no hay suficientes en la misma categoría
                    const others = prods.filter(p => p.id !== currentId && p.category !== category);
                    related = [...related, ...others];
                }

                // Tomar 4 random
                related = related.sort(() => 0.5 - Math.random()).slice(0, 4);

                if (related.length > 0) {
                    section.style.display = 'block';
                    container.innerHTML = '';
                    related.forEach(prod => {
                        const image = window.getFullImageUrl(prod.image_url) || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                        
    // Estrellas aleatorias entre 4 y 5
    const rating = (4 + Math.random()).toFixed(1);
    const starHTML = `
        <div class="stars">
            
            
            
            
            
            <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 5px;">(${rating})</span>
        </div>
    `;

                    const cardHTML = `
                        <div class="product-card" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}">
                                ${prod.stock <= 0 ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#333; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">AGOTADO</div>` : (prod.is_offer ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>` : '')}
                                <a href="producto.html?id=${prod.id}"><img src="${image}" alt="${prod.name}"></a>
                                <h4><a href="producto.html?id=${prod.id}" style="color:inherit; text-decoration:none;">${prod.name}</a></h4>
                                <div class="product-rating">
                                    
                                    <span>(4.8)</span>
                                </div>
                                <p class="price">${window.formatPrice(Number(prod.price))}</p>
                            </div>
                        `;
                        container.innerHTML += cardHTML;
                    });
                }
            })
            .catch(err => console.error("Error relacionados:", err));
    }

    // Cargar los productos reales en index.html (Y mezclarlos aleatoriamente)
    loadProductsFromDB();

    // Renderizar carrito si estámás en la página del carrito
    renderCart();
    
    // Renderizar checkout si estámás en checkout
    renderCheckout();

    // Lógica de Pasos de Checkout
    const btnNext = document.getElementById('btn-next-step');
    const btnPrev = document.getElementById('btn-prev-step');
    const part1 = document.getElementById('checkout-part1');
    const part2 = document.getElementById('checkout-part2');
    const step1Ind = document.getElementById('step1-indicator');
    const step2Ind = document.getElementById('step2-indicator');

    if (btnNext && btnPrev) {
        btnNext.addEventListener('click', () => {
            // Validar requeridos de parte 1 antes de avanzar
            const email = document.getElementById('chk-email').value;
            const name = document.getElementById('chk-name').value;
            const address = document.getElementById('chk-address').value;
            
            const city = document.getElementById('chk-city').value;
            const zip = document.getElementById('chk-zip').value;
            
            if (!email || !name || !address || !city || !zip) {
                showToast('Por favor completa todos los campos de envío.', 'fa-circle-exclamation');
                return;
            }
            
            const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
            if (!selectedShipping) {
                showToast('Por favor selecciona una opción de envío.', 'fa-truck');
                return;
            }

            part1.style.display = 'none';
            part2.style.display = 'block';
            step1Ind.classList.remove('active');
            step2Ind.classList.add('active');
        });

        btnPrev.addEventListener('click', () => {
            part2.style.display = 'none';
            part1.style.display = 'block';
            step2Ind.classList.remove('active');
            step1Ind.classList.add('active');
        });
    }

    // Envío final del Checkout
    
        const chkZip = document.getElementById('chk-zip');
        const chkCity = document.getElementById('chk-city');
        const shippingContainer = document.getElementById('shipping-options-container');
        
        if (chkZip && chkCity && shippingContainer) {
            chkZip.addEventListener('input', async (e) => {
                const zip = e.target.value.trim();
                
                // Mapa automático de CP a Ciudades locales
                const zipCityMap = {
                    '3283': 'San José',
                    '3280': 'Colón',
                    '3265': 'Villa Elisa',
                    '3260': 'Concepción del Uruguay'
                };
                
                if (zipCityMap[zip]) {
                    chkCity.value = zipCityMap[zip];
                } else if (zip.length >= 4) {
                    // Buscar en toda Argentina con Zippopotamus
                    chkCity.value = 'Buscando ciudad...';
                    
                    if (!chkCity.getAttribute('list')) {
                        chkCity.setAttribute('list', 'city-options');
                        let dl = document.createElement('datalist');
                        dl.id = 'city-options';
                        chkCity.parentNode.appendChild(dl);
                    }
                    
                    fetch('https://api.zippopotam.us/ar/' + zip)
                        .then(res => res.json())
                        .then(data => {
                            if (data.places && data.places.length > 0) {
                                const dl = document.getElementById('city-options');
                                if (dl) dl.innerHTML = ''; 
                                
                                data.places.forEach(placeObj => {
                                    const placeName = placeObj['place name'].toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
                                    const stateName = placeObj['state'].toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
                                    const fullString = placeName + ', ' + stateName;
                                    
                                    let option = document.createElement('option');
                                    option.value = fullString;
                                    if (dl) dl.appendChild(option);
                                });
                                
                                if (data.places.length === 1) {
                                    chkCity.value = data.places[0]['place name'].toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase()) + ', ' + data.places[0]['state'].toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
                                } else {
                                    chkCity.value = '';
                                    chkCity.placeholder = 'Elige tu ciudad/barrio de la lista...';
                                    chkCity.focus();
                                }
                            } else {
                                chkCity.value = '';
                                chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                            }
                        })
                        .catch(() => {
                            chkCity.value = '';
                            chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                        });
                }

                if (zip.length >= 4) {
                    shippingContainer.innerHTML = `
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; background: #fff;">
                            <input type="radio" name="shipping_method" value="coordinar" data-cost="0" data-name="Envío a Coordinar" style="accent-color: var(--text-color);" checked>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: var(--text-color);">Envío a Coordinar</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Coordinaremos el método de envío y el costo exacto por WhatsApp.</div>
                            </div>
                            <div style="font-weight: bold; color: var(--text-color);">
                                A confirmar
                            </div>
                        </label>
                    `;
                    
                    document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                        radio.addEventListener('change', renderCheckout);
                    });
                    
                    if(typeof renderCheckout === 'function') renderCheckout();
                }
            });
        }

const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');

        if (shippingRadios.length > 0) {
            shippingRadios.forEach(r => r.addEventListener('change', renderCheckout));
        }
        
        const zipInput = document.getElementById('chk-zip');
        if (zipInput) {
            zipInput.addEventListener('input', renderCheckout);
        }

        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (cart.length === 0) {
                showToast('No hay productos en el carrito.', 'fa-cart-shopping');
                return;
            }

            window.trackStoreEvent('checkout_started');

            const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'transferencia';

            // Recolectar datos
            const customer_email = document.getElementById('chk-email').value;
            const customer_name = document.getElementById('chk-name').value + ' ' + document.getElementById('chk-lastname').value;
            const city = document.getElementById('chk-city').value;
            const phone = document.getElementById('chk-phone') ? document.getElementById('chk-phone').value : '';
            const dni = document.getElementById('chk-dni') ? document.getElementById('chk-dni').value : '';
            const shipping_address = `Tel: ${phone} - DNI: ${dni} - ${document.getElementById('chk-address').value}, ${city} CP: ${document.getElementById('chk-zip').value}`;

            let shipping_cost = 0;
            var settings_ml = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
            const threshold = settings_ml.free_shipping_threshold;
            
            // Calcular total del carrito para saber si aplica envío gratis
            const cartTotalArs = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * window.dolarValue;
            const isFreeShipping = threshold > 0 && cartTotalArs >= threshold;


            const selShip = document.querySelector('input[name="shipping_method"]:checked');
            const shippingMethod = selShip?.dataset?.name || selShip?.value || 'A coordinar';
            if (selShip) {
                shipping_cost = parseFloat(selShip.dataset.cost) || 0;
                const userZip = document.getElementById('chk-zip').value.trim();
                
                if (userZip === '3283' || userZip === '3280' || userZip === '3265' || userZip === '3260') {
                    shipping_cost = 0;
                } else if (isFreeShipping) {
                    shipping_cost = 0;
                }
            }


            const items = cart.map(item => {
                return {
                    product_id: item.id, 
                    variant_name: item.variant_name || null,
                    quantity: item.quantity,
                    price: item.price
                };
            });

            
            try {
                let totalQuantity = 0;
                cart.forEach(item => totalQuantity += item.quantity);
                let wholesaleDiscount = 0;
                if (totalQuantity >= 10) wholesaleDiscount = 10;
                else if (totalQuantity >= 5) wholesaleDiscount = 7;
                else if (totalQuantity >= 3) wholesaleDiscount = 5;
                const isWholesale = wholesaleDiscount > 0;

                const total = cart.reduce((acc, item) => {
                    let finalPrice = item.price;
                    if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
                    return acc + (finalPrice * item.quantity);
                }, 0);
                const orderTotal = total;
                const finalShippingCost = (window.currentCoupon && window.currentCoupon.type === 'shipping') ? 0 : shipping_cost;
                const finalTotalArs = Math.round(orderTotal * window.dolarValue) + finalShippingCost;
                
                showToast('Procesando orden...', 'fa-spinner fa-spin');

                const response = await fetch(window.API_URL + '/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('phoneSpotToken')}`
                    },
                    body: JSON.stringify({ items, shipping_address, customer_email, customer_name, customer_phone: phone, shipping_method: shippingMethod, payment_method: paymentMethod, shipping_cost: finalShippingCost, discount_code: window.currentCoupon ? window.currentCoupon.code : null })
                });

                const data = await response.json();
                
                if (response.ok) {
                    
                    if (paymentMethod === 'efectivo') {
                        const confirmedTotalArs = Number(data.total_ars) || finalTotalArs;
                        // Generar mensaje de WhatsApp
                        let wpMsg = `Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo/Transferencia/Dolares.\n\n*Orden:* #${data.orderId}\n*Nombre:* ${customer_name}\n*Dirección:* ${shipping_address}\n*Total a pagar (efectivo/transferencia):* ${confirmedTotalArs.toLocaleString('es-AR')}\n`;
                        if (isWholesale) wpMsg += `*Beneficio:* Precio Mayorista Activado (-${wholesaleDiscount} USD c/u)\n`;
                        wpMsg += `\n*Productos:*\n`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
                            wpMsg += `- ${item.quantity}x ${item.name} (${window.formatPrice(finalPrice)})\n`;
                        });
                        wpMsg += `\nQuiero coordinar el pago en efectivo/Transferencia/Dolares con ustedes.`;
                        
                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = `https://wa.me/${wpPhone}?text=${encodeURIComponent(wpMsg)}`;
                        cart = [];
                        saveCart();
                        if (typeof updateCartUI === 'function') updateCartUI();
                        
                        showToast('¡Orden registrada! Redirigiendo a WhatsApp...', 'fa-check');
                        setTimeout(() => window.location.href = wpUrl, 2000);
                    }
                } else {
                    showToast(data.error || 'Error procesando la compra', 'fa-triangle-exclamation');
                }
            } catch (error) {
                console.error(error);
                showToast('Error de conexión', 'fa-wifi');
            }
        });
    }

    // La lógica del carrusel se inicializará después de cargar los settings
    initHeroCarousel = () => {
        const slides = document.querySelectorAll('.carousel-slide');
        if(slides.length > 0) {
            const prevBtn = document.querySelector('.carousel-prev');
            const nextBtn = document.querySelector('.carousel-next');
            const dots = document.querySelectorAll('.dot');
            let currentSlide = 0;
            if(window.slideInterval) clearInterval(window.slideInterval);

            const initCarousel = () => {
                slides.forEach((slide, index) => {
                    slide.style.transform = `translateX(${100 * (index - currentSlide)}%)`;
                    slide.classList.remove('active');
                    if(dots[index]) {
                        dots[index].style.display = 'inline-block';
                        dots[index].classList.remove('active');
                    }
                });
                slides[currentSlide].classList.add('active');
                if(dots[currentSlide]) dots[currentSlide].classList.add('active');
                
                // Esconder dots extra si hay menos slides que dots
                dots.forEach((dot, i) => {
                    if(i >= slides.length) dot.style.display = 'none';
                });
            };

            const nextSlide = () => {
                currentSlide = (currentSlide === slides.length - 1) ? 0 : currentSlide + 1;
                initCarousel();
            };

            const prevSlide = () => {
                currentSlide = (currentSlide === 0) ? slides.length - 1 : currentSlide - 1;
                initCarousel();
            };

            const startAutoPlay = () => { window.slideInterval = setInterval(nextSlide, 5000); };
            const resetAutoPlay = () => { clearInterval(window.slideInterval); startAutoPlay(); };

            // En celulares y tablets el carrusel responde al gesto horizontal.
            // No bloqueamos el desplazamiento vertical de la página.
            const carouselContainer = document.querySelector('.carousel-container');
            if (carouselContainer) {
                if (carouselContainer._swipeController) carouselContainer._swipeController.abort();
                const swipeController = new AbortController();
                carouselContainer._swipeController = swipeController;
                let touchStartX = 0;
                let touchStartY = 0;

                carouselContainer.addEventListener('touchstart', (event) => {
                    const touch = event.changedTouches[0];
                    touchStartX = touch.clientX;
                    touchStartY = touch.clientY;
                }, { passive: true, signal: swipeController.signal });

                carouselContainer.addEventListener('touchend', (event) => {
                    const touch = event.changedTouches[0];
                    const horizontalDistance = touch.clientX - touchStartX;
                    const verticalDistance = touch.clientY - touchStartY;
                    const minimumSwipe = 42;

                    if (Math.abs(horizontalDistance) > minimumSwipe && Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
                        if (horizontalDistance < 0) nextSlide();
                        else prevSlide();
                        resetAutoPlay();
                    }
                }, { passive: true, signal: swipeController.signal });
            }

            if(nextBtn) {
                // Removemos listeners previos clonando el botón para evitar que giren múltiples veces si se edita en vivo
                const newNext = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(newNext, nextBtn);
                newNext.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
            }
            if(prevBtn) {
                const newPrev = prevBtn.cloneNode(true);
                prevBtn.parentNode.replaceChild(newPrev, prevBtn);
                newPrev.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });
            }
            
            const freshDots = document.querySelectorAll('.dot');
            freshDots.forEach((dot, index) => {
                const newDot = dot.cloneNode(true);
                dot.parentNode.replaceChild(newDot, dot);
                if (index < slides.length) {
                    newDot.addEventListener('click', () => { currentSlide = index; initCarousel(); resetAutoPlay(); });
                }
            });

            initCarousel();
            startAutoPlay();
        }
    };

    // ==================== SISTEMA DE USUARIOS Y ADMIN ====================
    
    // Registro
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            
            showToast('Creando cuenta...', 'fa-spinner fa-spin');
            try {
                const res = await fetch(window.API_URL + '/api/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, email, password})
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('Revisa tu correo para verificar tu cuenta', 'fa-envelope-open-text');
                    const formWrapper = document.querySelector('.auth-form-wrapper');
                    if (formWrapper) {
                        formWrapper.innerHTML = `
                            <div style="text-align: center; padding: 2rem 0; animation: fadeUp 0.5s ease;">
                                <i class="fa-solid fa-envelope-circle-check" style="font-size: 5rem; color: #00a650; margin-bottom: 1.5rem;"></i>
                                <h2 style="margin-bottom: 1rem; font-size: 2rem;">¡Casi listo, ${name}!</h2>
                                <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.5; margin-bottom: 1rem;">Te hemos enviado un enlace de confirmación a <b style="color: var(--text-color);">${email}</b>.</p>
                                <p style="color: var(--text-muted); font-size: 1rem;">Haz clic en el enlace seguro dentro del correo para activar tu cuenta.</p>
                                <p style="font-size: 0.85rem; color: #888; margin-top: 2rem;"><i class="fa-solid fa-triangle-exclamation"></i> ¿No lo encuentras? Revisa tu carpeta de Spam o Correo No Deseado.</p>
                            </div>
                        `;
                    }
                } else {
                    showToast(data.error, 'fa-triangle-exclamation');
                }
            } catch (err) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
        });
    }

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('log-email').value;
            const password = document.getElementById('log-password').value;
            
            showToast('Iniciando sesión...', 'fa-spinner fa-spin');
            try {
                const res = await fetch(window.API_URL + '/api/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({email, password})
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('phoneSpotToken', data.token);
                    localStorage.setItem('phoneSpotRole', data.role);
                    showToast('¡Bienvenido!', 'fa-check');
                    if(data.role === 'admin') setTimeout(() => window.location.href = 'admin.html', 1500);
                    else setTimeout(() => window.location.href = 'index.html', 1500);
                } else {
                    showToast(data.error, 'fa-triangle-exclamation');
                }
            } catch (err) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
        });
    }

    // Admin Panel - Crear Producto
    const adminForm = document.getElementById('admin-product-form');
    if (adminForm) {
        if(localStorage.getItem('phoneSpotRole') !== 'admin') {
            showToast('Acceso Denegado. Solo administradores.', 'fa-lock');
            setTimeout(() => window.location.href = 'index.html', 1500);
        }

        // Lógica de añadir variantes
        const btnAddVariant = document.getElementById('btn-add-variant');
        const variantsContainer = document.getElementById('variants-container');
        if (btnAddVariant && variantsContainer) {
            btnAddVariant.addEventListener('click', () => {
                const row = document.createElement('div');
                row.className = 'variant-row';
                row.style.cssText = 'display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;';
                row.innerHTML = `
                    <input type="text" class="var-color" placeholder="Color (Ej: Blanco)" required style="flex:1; min-width:120px;">
                    <input type="text" class="var-cap" placeholder="Almacen. (Ej: 256GB)" required style="flex:1; min-width:120px;">
                    <input type="text" class="var-ram" placeholder="RAM (Opc. Ej: 8GB)" style="flex:1; min-width:100px;">
                    <input type="text" class="var-batt" placeholder="Batería (Opc. Ej: 100%)" style="flex:1; min-width:110px;">
                    <input type="number" class="var-price" placeholder="Precio" min="0" style="width:110px;" title="Deja vacío para precio base">
                    <input type="number" class="var-stock" placeholder="Stock" required min="0" style="width:80px;">
                    <button type="button" class="btn-danger btn-remove-var" style="padding:0 0.8rem;"><i class="fa-solid fa-xmark"></i></button>
                `;
                variantsContainer.appendChild(row);

                row.querySelector('.btn-remove-var').addEventListener('click', () => row.remove());
            });
        }

        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('phoneSpotToken');
            
            // Recopilar variantes y stock
            let totalStock = 0;
            const variantsArray = [];
            document.querySelectorAll('.variant-row').forEach(row => {
                const color = row.querySelector('.var-color').value.trim();
                const capacity = row.querySelector('.var-cap').value.trim();
                const ram = row.querySelector('.var-ram').value.trim();
                const battEl = row.querySelector('.var-batt');
                const batt = battEl ? battEl.value.trim() : '';
                const priceEl = row.querySelector('.var-price');
                const price = priceEl && priceEl.value ? parseFloat(priceEl.value) : null;
                const stock = parseInt(row.querySelector('.var-stock').value) || 0;
                if(color && capacity) {
                    variantsArray.push({ color, capacity, ram, batt, price, stock });
                    totalStock += stock;
                }
            });

            const formData = new FormData();
            formData.append('name', document.getElementById('prod-name').value);
            const baseDesc = document.getElementById('prod-desc').value;
            const conditionEl = document.getElementById('prod-condition');
            const condition = conditionEl ? conditionEl.value : 'Nuevo, Caja Sellada';
            
            // Si es Americano o Usado, lo agregamos a la descripción para que el buscador y el filtro lo detecten
            const finalDesc = condition !== 'Nuevo, Caja Sellada' ? `[Condición: ${condition}] ${baseDesc}` : baseDesc;
            formData.append('description', finalDesc);
            formData.append('price', document.getElementById('prod-price').value);
            formData.append('stock', totalStock); // El stock total es la suma de las variantes
            formData.append('brand', document.getElementById('prod-brand').value);
            formData.append('category', document.getElementById('prod-category').value);
            formData.append('is_offer', document.getElementById('prod-offer').value);
            formData.append('variants', JSON.stringify(variantsArray)); // Pasamos las variantes como JSON
            
            const fileInput = document.getElementById('prod-img');
            if (fileInput.files[0]) {
                formData.append('image', fileInput.files[0]);
            }

            showToast('Subiendo a la tienda...', 'fa-spinner fa-spin');
            try {
                const res = await fetch(window.API_URL + '/api/products', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // No poner 'Content-Type': 'application/json' porque fetch lo pone solo para FormData
                    },
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('¡Producto subido y visible en la tienda!', 'fa-check');
                    adminForm.reset();
                    if(typeof loadAdminProducts === 'function') loadAdminProducts();
                } else {
                    showToast(data.error || 'Error al subir', 'fa-triangle-exclamation');
                }
            } catch (err) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
        });

        // ==================== LISTAR Y GESTIONAR PRODUCTOS EN ADMIN ====================
        const productListContainer = document.getElementById('admin-product-list');
        if (productListContainer) {
            window.loadAdminProducts = async () => {
                try {
                    const res = await fetch(window.API_URL + '/api/products');
                    const prods = await res.json();
                    productListContainer.innerHTML = '';
                    if(prods.length === 0) {
                        productListContainer.innerHTML = '<p>No hay productos subidos.</p>';
                        return;
                    }

                    
                    prods.forEach(p => {
                        window[`adminProduct_${p.id}`] = p; // save product data globally for easy access
                        productListContainer.innerHTML += `
                            <div class="slide-item" style="display:flex; flex-direction:column; gap:1rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                    <div style="flex:2;">
                                        <h5 style="margin:0;">${p.name}</h5>
                                        <p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: ${p.category} | Marca: ${p.brand}</p>
                                        <textarea id="desc-${p.id}" rows="2" style="width:100%; margin-top:0.5rem; font-size:0.8rem; padding:0.3rem;" placeholder="Descripción">${p.description || ''}</textarea>
                                    </div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <label style="font-size:0.8rem;">Precio (USD):</label>
                                        <input type="number" id="price-${p.id}" value="${p.price}" style="width:80px; padding:0.2rem;">
                                        
                                        <label style="font-size:0.8rem;">Stock:</label>
                                        <input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px; padding:0.2rem;" ${(p.variants && p.variants.length > 0) ? 'disabled title="El stock se edita desde Variantes/Colores" style="background:#eee; width:70px; padding:0.2rem;"' : ''}>
                                        
                                        <button onclick="updateProductBasic(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Info</button>
                                        <button onclick="toggleVariantsEdit(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:var(--text-color);">Variantes/Colores</button>
                                        <button onclick="deleteProduct(${p.id})" class="btn-danger" style="padding:0.3rem 0.5rem;"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </div>
                                <div id="variants-edit-${p.id}" style="display:none; padding:1rem; background:var(--bg-color); border-radius:8px; border:1px dashed var(--border-color);">
                                    <h6 style="margin-bottom:0.5rem;">Variantes (Colores/Capacidad)</h6>
                                    <div id="variants-list-${p.id}" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;"></div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <input type="text" id="new-color-${p.id}" placeholder="Color (ej. Azul)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-cap-${p.id}" placeholder="Capacidad (ej. 128GB)" style="padding:0.2rem; width:120px;">
                                        <input type="text" id="new-ram-${p.id}" placeholder="RAM (ej. 8GB)" style="padding:0.2rem; width:80px;">
                                        <input type="text" id="new-batt-${p.id}" placeholder="Batería (Opc)" style="padding:0.2rem; width:90px;">
                                        <input type="number" id="new-vprice-${p.id}" placeholder="Precio USD (Opc)" style="padding:0.2rem; width:110px;">
                                        <input type="number" id="new-vstock-${p.id}" placeholder="Stock" style="padding:0.2rem; width:70px;">
                                        <button onclick="addVariantToProduct(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#2ecc71; color:#fff;">+ Agregar Variante</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                } catch(e) { productListContainer.innerHTML = 'Error cargando productos'; }
            };

            
            window.updateProductBasic = async (id) => {
                const p = window[`adminProduct_${id}`];
                const price = document.getElementById(`price-${id}`).value;
                let stock = document.getElementById(`stock-${id}`).value;
                const description = document.getElementById(`desc-${id}`) ? document.getElementById(`desc-${id}`).value : undefined;
                
                let hasVariants = p && p.variants && p.variants.length > 0;
                
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const bodyData = { price, description };
                    if (!hasVariants) {
                        bodyData.stock = stock;
                    }
                    
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(bodyData)
                    });
                    
                    if (res.ok) {
                        showToast('Datos actualizados', 'fa-check');
                        window.loadAdminProducts();
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };

            window.toggleVariantsEdit = (id) => {
                const div = document.getElementById(`variants-edit-${id}`);
                const isHidden = div.style.display === 'none';
                div.style.display = isHidden ? 'block' : 'none';
                if (isHidden) renderProductVariants(id);
            };

            window.renderProductVariants = (id) => {
                const p = window[`adminProduct_${id}`];
                const list = document.getElementById(`variants-list-${id}`);
                if (!p || !list) return;
                
                let variants = [];
                try { variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants; } catch(e){}
                if (!variants || !Array.isArray(variants)) variants = [];
                
                window[`adminProductVariants_${id}`] = variants; // keep track of parsed variants

                list.innerHTML = variants.map((v, index) => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f5f7; padding:0.5rem; border-radius:4px; flex-wrap:wrap; gap:0.5rem;">
                        <span style="font-size:0.85rem;">${v.color} - ${v.capacity} ${v.ram ? '- ' + v.ram : ''} ${v.batt ? '- Bat: ' + v.batt : ''} ${v.price ? ' - <strong style="color:#0071e3">US$ ' + v.price + '</strong>' : ''}</span>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <label style="font-size:0.8rem; margin:0;">Stock:</label>
                            <input type="number" id="edit-vstock-${id}-${index}" value="${v.stock}" style="width:60px; padding:0.2rem; font-size:0.8rem;">
                            <button onclick="updateVariantStock(${id}, ${index})" style="background:#333; color:white; border:none; border-radius:4px; padding:0.2rem 0.5rem; font-size:0.8rem; cursor:pointer;">Guardar</button>
                            <button onclick="removeVariantFromProduct(${id}, ${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer; margin-left:0.5rem;"><i class="fa-solid fa-times"></i></button>
                        </div>
                    </div>
                `).join('');
            };

            window.addVariantToProduct = async (id) => {
                const color = document.getElementById(`new-color-${id}`).value.trim();
                const cap = document.getElementById(`new-cap-${id}`).value.trim();
                const ram = document.getElementById(`new-ram-${id}`).value.trim();
                const battEl = document.getElementById(`new-batt-${id}`);
                const batt = battEl ? battEl.value.trim() : '';
                const stock = parseInt(document.getElementById(`new-vstock-${id}`).value) || 0;
                const rawPrice = document.getElementById(`new-vprice-${id}`).value;
                const price = rawPrice ? parseFloat(rawPrice) : null;
                
                if (!color || !cap) return showToast('Color y Capacidad son obligatorios', 'fa-exclamation');

                let variants = window[`adminProductVariants_${id}`] || [];
                variants.push({ color, capacity: cap, ram, batt, stock, price });
                
                await saveVariantsToDB(id, variants);
            };

            window.updateVariantStock = async (id, index) => {
                let variants = window[`adminProductVariants_${id}`] || [];
                const newStock = document.getElementById(`edit-vstock-${id}-${index}`).value;
                if (!variants[index]) return;
                variants[index].stock = parseInt(newStock) || 0;
                await saveVariantsToDB(id, variants);
            };

            window.removeVariantFromProduct = async (id, index) => {
                let variants = window[`adminProductVariants_${id}`] || [];
                variants.splice(index, 1);
                await saveVariantsToDB(id, variants);
            };

            const saveVariantsToDB = async (id, variants) => {
                const token = localStorage.getItem('phoneSpotToken');
                const totalStock = variants.reduce((acc, v) => acc + (parseInt(v.stock)||0), 0);
                
                showToast('Actualizando variantes...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ variants, stock: totalStock })
                    });
                    if(res.ok) {
                        showToast('Variantes actualizadas', 'fa-check');
                        window.loadAdminProducts(); // re-fetch products
                    } else {
                        showToast('Error en el servidor', 'fa-times');
                    }
                } catch(e) { showToast('Error al actualizar', 'fa-times'); }
            };

            window.deleteProduct = async (id) => {
                if(!confirm('¿Estás seguro de eliminar está producto definitivamente?')) return;
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if(res.ok) {
                        showToast('Producto eliminado', 'fa-check');
                        window.loadAdminProducts();
                    } else showToast('Error eliminando producto', 'fa-triangle-exclamation');
                } catch(e) {}
            };

            window.loadAdminProducts();
        }

        // ==================== LISTAR ÓRDENES ====================
        const ordersListContainer = document.getElementById('admin-orders-list');
        if (ordersListContainer) {
            window.updateOrderStatus = async (id) => {
              const status = document.getElementById('status-'+id).value;
              const tracking = document.getElementById('tracking-'+id).value;
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch(window.API_URL + '/api/orders/'+id+'/status', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                      body: JSON.stringify({ status, tracking_code: tracking })
                  });
                  if(res.ok) {
                      alert('Orden actualizada correctamente.');
                  } else {
                      alert('Error al actualizar.');
                  }
              } catch(e) { alert(e.message); }
          };

          window.loadAdminOrders = async () => {
              const token = localStorage.getItem('phoneSpotToken');
              try {
                  const res = await fetch(window.API_URL + '/api/orders', {
                      headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const orders = await res.json();
                  
                  let totalRevenue = 0;
                  let totalItems = 0;
                  const productSales = {};

                  ordersListContainer.innerHTML = '';
                  if(!orders || orders.length === 0) {
                      ordersListContainer.innerHTML = '<p>No hay ventas registradas aún.</p>';
                      return;
                  }

                  orders.forEach(o => {
                      totalRevenue += parseFloat(o.total) || 0;
                      
                      let itemsHTML = '';
                      if (o.order_items && o.order_items.length > 0) {
                          itemsHTML = o.order_items.map(item => {
                              const varText = item.variant_name ? ` <strong>(${item.variant_name})</strong>` : '';
                              const prodName = item.products ? item.products.name : 'Producto Eliminado';
                              totalItems += item.quantity;
                              if (!productSales[prodName]) {
                                  productSales[prodName] = 0;
                              }
                              productSales[prodName] += item.quantity;
                              return `<li>${item.quantity}x ${prodName}${varText} - $${item.price}</li>`;
                          }).join('');
                      }

                      ordersListContainer.innerHTML += `
                          <div class="slide-item" style="display:flex; flex-direction:column; gap:0.5rem;">
                              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                  <div style="flex:2;">
                                      <h5 style="margin:0;">Orden #${String(o.id)} <span style="color:#555555;">($${o.total})</span></h5>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-calendar"></i> ${new Date(o.created_at).toLocaleString()}</p>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-user"></i> ${escapeText(o.customer_name || 'Cliente')} · ${escapeText(o.customer_email || 'Sin email')}</p>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> Envío: ${o.shipping_address}</p>
                                  </div>
                                  <div style="flex:2; display:flex; gap:1rem; align-items:center; background: var(--gray-bg); padding:0.5rem; border-radius:8px;">
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Estado:</label>
                                          <select id="status-${o.id}" style="padding:0.2rem; border-radius:4px;">
                                              <option value="pending" ${o.status==='pending'?'selected':''}>Pendiente</option>
                                              <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmado</option>
                                              <option value="preparing" ${o.status==='preparing'?'selected':''}>En preparación</option>
                                              <option value="completed" ${o.status==='completed'?'selected':''}>Pago confirmado</option>
                                              <option value="shipped" ${o.status==='shipped'?'selected':''}>Enviado</option>
                                              <option value="delivered" ${o.status==='delivered'?'selected':''}>Entregado</option>
                                              <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelado</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Tracking:</label>
                                          <input type="text" id="tracking-${o.id}" value="${o.tracking_code || ''}" placeholder="Cód. Correo" style="width:100px; padding:0.2rem; border-radius:4px; border: 1px solid var(--border-color);">
                                      </div>
                                      <button onclick="updateOrderStatus('${o.id}')" class="btn" style="padding:0.4rem 0.6rem; font-size:0.8rem; height:fit-content; background:#3498db; margin-top:1rem;">Guardar</button>
                                  </div>
                              </div>
                              <ul style="margin:0; padding-left:1.5rem; font-size:0.85rem; color: var(--text-muted);">
                                  ${itemsHTML}
                              </ul>
                          </div>
                      `;
                  });

                  const totalRevEl = document.getElementById('stat-total-revenue');
                  const totalVenEl = document.getElementById('stat-total-orders');
                  const totalItemsEl = document.getElementById('stat-total-items');
                  const topProdEl = document.getElementById('top-products-list');

                  if(totalRevEl) totalRevEl.innerText = '$' + totalRevenue.toLocaleString('es-AR');
                  if(totalVenEl) totalVenEl.innerText = orders.length;
                  if(totalItemsEl) totalItemsEl.innerText = totalItems;
                  
                  if(topProdEl && Object.keys(productSales).length > 0) {
                      const topProduct = Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b);
                      topProdEl.innerHTML = `<strong>${escapeText(topProduct)}</strong> · ${productSales[topProduct]} unidades`;
                  }

              } catch(e) {
                  console.error(e);
              }
          };
          window.loadAdminOrders();
        }

        const reviewsAdminContainer = document.getElementById('admin-reviews-list');
        if (reviewsAdminContainer) {
            window.loadAdminReviews = async () => {
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const response = await fetch(window.API_URL + '/api/admin/reviews', { headers: { 'Authorization': `Bearer ${token}` } });
                    const reviews = await response.json();
                    if (!response.ok) throw new Error(reviews.error || 'No se pudieron cargar las reseñas.');
                    reviewsAdminContainer.innerHTML = reviews.length ? reviews.map((review) => `
                        <article class="slide-item" style="display:flex;flex-direction:column;gap:.45rem;">
                            <strong>${escapeText(review.products?.name || 'Producto eliminado')} · ${'★'.repeat(review.rating)}</strong>
                            <span>${escapeText(review.user_name)}: ${escapeText(review.comment)}</span>
                            <small style="color:var(--text-muted)">${review.approved ? 'Publicada' : 'Pendiente de publicación'}</small>
                            <button class="btn" style="align-self:flex-start;padding:.45rem .7rem;" onclick="setReviewApproval(${Number(review.id)}, ${!review.approved})">${review.approved ? 'Ocultar' : 'Publicar'}</button>
                        </article>`).join('') : '<p>No hay reseñas todavía.</p>';
                } catch (error) {
                    reviewsAdminContainer.innerHTML = `<p style="color:#c0392b;">${escapeText(error.message)}</p>`;
                }
            };
            window.setReviewApproval = async (id, approved) => {
                const token = localStorage.getItem('phoneSpotToken');
                const response = await fetch(window.API_URL + `/api/admin/reviews/${id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ approved })
                });
                const result = await response.json();
                if (!response.ok) return showToast(result.error || 'No se pudo actualizar la reseña.', 'fa-triangle-exclamation');
                showToast(result.message, 'fa-check');
                window.loadAdminReviews();
            };
            window.loadAdminReviews();
        }

        const analyticsSummary = document.getElementById('analytics-summary');
        if (analyticsSummary) {
            fetch(window.API_URL + '/api/admin/analytics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('phoneSpotToken')}` } })
                .then(response => response.json().then(data => ({ response, data })))
                .then(({ response, data }) => {
                    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las métricas.');
                    analyticsSummary.textContent = `${data.page_views} visitas · ${data.add_to_cart} agregados al carrito · ${data.checkout_started} inicios de compra.`;
                })
                .catch(() => { analyticsSummary.textContent = 'Las métricas se mostrarán cuando haya actividad nueva.'; });
        }

        // ==================== BÚSQUEDA INTELIGENTE ====================
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        let cachedProductsForSearch = null;

        if (searchInput && searchResults) {
            // Solo descargar los productos cuando hagan click/focus en la barra para no gastar internet
            searchInput.addEventListener('focus', async () => {
                if (!cachedProductsForSearch) {
                    try {
                        const res = await fetch(window.API_URL + '/api/products');
                        cachedProductsForSearch = await res.json();
                    } catch(e) {}
                }
            });

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query || !cachedProductsForSearch) {
                    searchResults.style.display = 'none';
                    return;
                }

                // Buscar por nombre, marca o categoría
                const matches = cachedProductsForSearch.filter(p => 
                    (p.name && p.name.toLowerCase().includes(query)) || 
                    (p.brand && p.brand.toLowerCase().includes(query)) ||
                    (p.category && p.category.toLowerCase().includes(query))
                ).slice(0, 5); // Mostrar solo los 5 mejores resultados

                if (matches.length > 0) {
                    searchResults.innerHTML = matches.map(m => `
                        <a href="producto.html?id=${m.id}" style="padding:0.8rem; display:flex; align-items:center; gap:1rem; text-decoration:none; color: var(--text-color); border-bottom: 1px solid var(--border-color); transition:background 0.2s;">
                            <img src="${m.image_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=50&q=80'}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                            <div style="flex:1;">
                                <div style="font-size:0.9rem; font-weight:bold;">${m.name}</div>
                                <div style="font-size:0.8rem; color: var(--text-muted);">$${m.price} | ${m.brand}</div>
                            </div>
                        </a>
                    `).join('');
                } else {
                    searchResults.innerHTML = '<div style="padding:0.8rem; font-size:0.9rem; color: var(--text-muted); text-align:center;">No encontramos está producto 😢</div>';
                }
                searchResults.style.display = 'flex';
            });

            // Ocultar resultados si se hace click fuera de la barra
            document.addEventListener('click', (e) => {
                if(!e.target.closest('.search-bar')) {
                    searchResults.style.display = 'none';
                }
            });
        }

        const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('phoneSpotToken');
            localStorage.removeItem('phoneSpotRole');
            window.location.href = 'index.html';
        });

        // ==================== CONFIGURACIÓN VISUAL DEL ADMIN (Banners y Carrusel) ====================
        let currentSettings = { top_banner: '', carousel: [], shipping_correo: 8500, shipping_andreani: 12000, free_shipping_threshold: 1500000 };
            window.renderBannerMessages = () => {
                const list = document.getElementById('banner-messages-list');
                if(!list) return;
                let banners = currentSettings.top_banner;
                if (!Array.isArray(banners)) {
                    banners = typeof banners === 'string' && banners.trim() !== '' ? [banners] : [];
                    currentSettings.top_banner = banners;
                }
                list.innerHTML = banners.map((b, i) => `
                    <div style="display:flex; gap:10px;">
                        <input type="text" value="${b.replace(/"/g, '&quot;')}" onchange="updateBannerMessage(${i}, this.value)" style="flex:1;">
                        <button type="button" onclick="removeBannerMessage(${i})" style="background:#ff4757; color:white; border:none; padding:0 15px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join('');
            };
            window.addBannerMessage = () => {
                if(!Array.isArray(currentSettings.top_banner)) currentSettings.top_banner = [];
                currentSettings.top_banner.push('');
                window.renderBannerMessages();
            };
            window.updateBannerMessage = (i, val) => {
                currentSettings.top_banner[i] = val;
            };
            window.removeBannerMessage = async (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
                await window.saveSettingsFunc(); // auto save
            };


        
    const waForm = document.getElementById('admin-whatsapp-form');
    if (waForm) {
        waForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentSettings.whatsapp_number = document.getElementById('set-whatsapp-num').value.replace(/[^0-9]/g, '');
            await saveSettings(currentSettings);
            showToast('Número de WhatsApp guardado', 'fa-check');
        });
    }

    const couponForm = document.getElementById('admin-coupon-form');
    if (couponForm) {
        window.renderAdminCoupons = () => {
            const list = document.getElementById('coupons-list');
            if (!list) return;
            const coupons = currentSettings.coupons || [];
            list.innerHTML = coupons.map((c, i) => `
                <div style="background: var(--gray-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.5rem;">
                    <strong>${c.code}</strong> 
                    <span style="font-size: 0.8rem; color: var(--text-muted);">(${c.type === 'shipping' ? 'Envío' : c.value})</span>
                    <i class="fa-solid fa-times" style="cursor: pointer; color: #ff4757;" onclick="deleteCoupon(${i})"></i>
                </div>
            `).join('');
        };

        window.deleteCoupon = async (index) => {
            currentSettings.coupons.splice(index, 1);
            await saveSettings(currentSettings);
            window.renderAdminCoupons();
        };

        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentSettings.coupons) currentSettings.coupons = [];
            currentSettings.coupons.push({
                code: document.getElementById('add-coupon-code').value.trim().toUpperCase(),
                type: document.getElementById('add-coupon-type').value,
                value: Number(document.getElementById('add-coupon-value').value)
            });
            await saveSettings(currentSettings);
            couponForm.reset();
            window.renderAdminCoupons();
            showToast('Cupón agregado', 'fa-check');
        });
    }

    const bannerForm = document.getElementById('admin-banner-form');
        const carouselForm = document.getElementById('admin-carousel-form');
        const shippingForm = document.getElementById('admin-shipping-form');
        
        if (bannerForm || carouselForm || shippingForm) {
            // Cargar datos actuales
            const loadAdminSettings = async () => {
                try {
                    const res = await fetch(window.API_URL + '/api/settings');
                    const data = await res.json();
                    currentSettings = { ...currentSettings, ...data };
                    
                    window.renderBannerMessages();
                    if(document.getElementById('set-flash-date')) {
                        document.getElementById('set-flash-date').value = currentSettings.flash_end_date || '';
                    }
                    if(document.getElementById('set-brands-list')) {
                        document.getElementById('set-brands-list').value = currentSettings.brands_list || '';
                    }
                    if(document.getElementById('set-ship-correo')) {
                        document.getElementById('set-ship-correo').value = currentSettings.shipping_correo || 8500;
                    }
                    if(document.getElementById('set-ship-andreani')) {
                        document.getElementById('set-ship-andreani').value = currentSettings.shipping_andreani || 12000;
                    }
                    if(document.getElementById('set-free-shipping')) {
                        document.getElementById('set-free-shipping').value = currentSettings.free_shipping_threshold || 1500000;

    const waInput = document.getElementById('set-whatsapp-num');
    if (waInput && currentSettings.whatsapp_number) waInput.value = currentSettings.whatsapp_number;
    window.renderAdminCoupons();

                    }
                    renderAdminCarouselList();
                } catch(e) { console.error('Error', e); }
            };

            window.saveSettingsFunc = async () => {
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(window.API_URL + '/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(currentSettings)
                    });
                    if (res.ok) showToast('Guardado correctamente', 'fa-check');
                    else showToast('Error al guardar', 'fa-triangle-exclamation');
                } catch(e) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
            };
            const saveSettings = async () => { await window.saveSettingsFunc(); };

            const renderAdminCarouselList = () => {
                const list = document.getElementById('carousel-list');
                if(!list) return;
                list.innerHTML = '';
                if(!currentSettings.carousel || currentSettings.carousel.length === 0) {
                    list.innerHTML = '<p style="color: var(--text-muted);">No hay slides en el carrusel.</p>';
                    return;
                }
                
                currentSettings.carousel.forEach((slide, index) => {
                    list.innerHTML += `
                        <div class="slide-item">
                            <div class="slide-info">
                                <h5>${slide.title}</h5>
                                <p>${slide.subtitle} | Link: ${slide.link}</p>
                            </div>
                            <div style="display:flex; gap:0.5rem;">
                                <button type="button" class="btn" style="background:#0071e3; color:white; padding:0.4rem;" onclick="window.editSlide(${index})"><i class="fa-solid fa-pen"></i></button>
                                <button type="button" class="btn-danger" onclick="deleteSlide(${index})"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                    `;
                });
            };

            window.deleteSlide = (index) => {
                if(confirm('¿Seguro que deseas eliminar esta slide?')) {
                    currentSettings.carousel.splice(index, 1);
                    renderAdminCarouselList();
                    saveSettings();
                }
            };
            
            window.editSlide = (index) => {
                const slide = currentSettings.carousel[index];
                document.getElementById('set-car-title').value = slide.title;
                document.getElementById('set-car-subtitle').value = slide.subtitle;
                document.getElementById('set-car-link').value = slide.link;
                document.getElementById('set-car-edit-index').value = index;
                
                const btn = document.getElementById('car-submit-btn');
                if(btn) btn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
                const cancelBtn = document.getElementById('car-cancel-btn');
                if(cancelBtn) cancelBtn.style.display = 'inline-block';
                
                document.getElementById('admin-carousel-form').scrollIntoView({behavior: 'smooth'});
            };
            
            window.cancelEditCarousel = () => {
                document.getElementById('admin-carousel-form').reset();
                document.getElementById('set-car-edit-index').value = '';
                const btn = document.getElementById('car-submit-btn');
                if(btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Añadir al Carrusel';
                const cancelBtn = document.getElementById('car-cancel-btn');
                if(cancelBtn) cancelBtn.style.display = 'none';
            };

            if(bannerForm) {
                bannerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    // Extraer los mensajes del banner en el momento del submit para evitar bugs de onchange
                    const listContainer = document.getElementById('banner-messages-list');
                    if (listContainer) {
                        const inputs = listContainer.querySelectorAll('input[type="text"]');
                        currentSettings.top_banner = Array.from(inputs).map(inp => inp.value);
                    }

                    if(document.getElementById('set-flash-date')) {
                        currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                    }
                    if(document.getElementById('set-brands-list')) {
                        currentSettings.brands_list = document.getElementById('set-brands-list').value;
                    }
                    window.saveSettingsFunc();
                });
            }

            if(shippingForm) {
                shippingForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    currentSettings.shipping_correo = Number(document.getElementById('set-ship-correo').value) || 8500;
                    currentSettings.shipping_andreani = Number(document.getElementById('set-ship-andreani').value) || 12000;
                    currentSettings.free_shipping_threshold = Number(document.getElementById('set-free-shipping').value) || 1500000;
                    saveSettings();
                });
            }

            if(carouselForm) {
                
                carouselForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const title = document.getElementById('set-car-title').value.trim();
                    const subtitle = document.getElementById('set-car-subtitle').value.trim();
                    const link = document.getElementById('set-car-link').value.trim();
                    
                    const fileInput = document.getElementById('set-car-img');
                    const editIndex = document.getElementById('set-car-edit-index').value;
                    const isEditing = editIndex !== '';
                    
                    if(!isEditing && fileInput.files.length === 0) {
                        return showToast('Selecciona una imagen de fondo', 'fa-image');
                    }
                    
                    const btn = carouselForm.querySelector('button[type="submit"]');
                    const oldBtnHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
                    btn.disabled = true;

                    try {
                        let imageUrl = '';
                        if (fileInput.files.length > 0) {
                            const formData = new FormData();
                            formData.append('image', fileInput.files[0]);
                            const token = localStorage.getItem('phoneSpotToken');
                            const res = await fetch(window.API_URL + '/api/upload', {
                                method: 'POST',
                                headers: { 'Authorization': 'Bearer ' + token },
                                body: formData
                            });
                            const data = await res.json();
                            if (data.url) {
                                imageUrl = data.url;
                            } else {
                                throw new Error('Error al subir imagen');
                            }
                        } else if (isEditing) {
                            // Keep existing image
                            imageUrl = currentSettings.carousel[parseInt(editIndex)].image;
                        }

                        if(!currentSettings.carousel) currentSettings.carousel = [];
                        
                        if (isEditing) {
                            currentSettings.carousel[parseInt(editIndex)] = { title, subtitle, link, image: imageUrl };
                        } else {
                            currentSettings.carousel.push({ title, subtitle, link, image: imageUrl });
                        }
                        
                        await saveSettings();
                        window.cancelEditCarousel();
                        renderAdminCarouselList();
                        
                    } catch(err) {
                        showToast('Error al procesar el carrusel', 'fa-times');
                    } finally {
                        btn.innerHTML = oldBtnHTML;
                        btn.disabled = false;
                    }
                });
    
            }

            loadAdminSettings();
        }
    }
});

// Función para cargar ajustes en el frontend (index.html)
async function applyFrontendSettings() {
    try {
        const res = await fetch(window.API_URL + '/api/settings');
        const data = await res.json();
        
        // Guardar costos globalmente para uso en checkout
        window.phoneSpotSettings = data;
        
        // Inyectar Boton WA Dynamico
        if (!document.getElementById('wa-float-btn')) {
            const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
            const waBtn = document.createElement('a');
            waBtn.id = 'wa-float-btn';
            waBtn.href = `https://wa.me/${waPhone}?text=${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}`;
            waBtn.className = 'whatsapp-float fade-up visible';
            waBtn.target = '_blank';
            waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
            document.body.appendChild(waBtn);
        } else {
            const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
            document.getElementById('wa-float-btn').href = `https://wa.me/${waPhone}?text=${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}`;
        }

        // Actualizar textos en checkout si existen
        const costCorreoEl = document.getElementById('cost-correo');
        const costAndreaniEl = document.getElementById('cost-andreani');
        if (costCorreoEl) {
            costCorreoEl.innerText = `$${(data.shipping_correo || 8500).toLocaleString('es-AR')}`;
            costCorreoEl.dataset.cost = data.shipping_correo || 8500;
        }
        if (costAndreaniEl) {
            costAndreaniEl.innerText = `$${(data.shipping_andreani || 12000).toLocaleString('es-AR')}`;
            costAndreaniEl.dataset.cost = data.shipping_andreani || 12000;
        }
        
        const costCorreoSucursalEl = document.getElementById('cost-correo-sucursal');
        const costAndreaniSucursalEl = document.getElementById('cost-andreani-sucursal');
        if (costCorreoSucursalEl) {
            const cost = Math.max(0, (data.shipping_correo || 8500) - 2000);
            costCorreoSucursalEl.innerText = '$' + cost.toLocaleString('es-AR');
            costCorreoSucursalEl.dataset.cost = cost;
        }
        if (costAndreaniSucursalEl) {
            const cost = Math.max(0, (data.shipping_andreani || 12000) - 3000);
            costAndreaniSucursalEl.innerText = '$' + cost.toLocaleString('es-AR');
            costAndreaniSucursalEl.dataset.cost = cost;
        }

        // Marquee
        const topBannerDiv = document.querySelector('.top-banner');
        if (topBannerDiv) {
            let banners = data.top_banner;
            if (!Array.isArray(banners)) {
                banners = typeof banners === 'string' && banners.trim() !== '' ? [banners] : [];
            }
            // Filter out empty strings
            banners = banners.filter(b => b.trim() !== '');
            
            if (banners.length > 0) {
                topBannerDiv.style.display = 'block';
                const container = document.querySelector('.top-banner .scrolling-text');
                if (container) {
                    // Create enough repetitions for infinite scroll
                    const contentHtml = banners.map(b => `<span>${b}</span>`).join('');
                    // Repetimos 4 veces para asegurar que llene toda la pantalla y no se corte
                    container.innerHTML = contentHtml + contentHtml + contentHtml + contentHtml;
                }
            } else {
                topBannerDiv.style.display = 'none';
            }
        }

        // Carousel Múltiple
        const carouselContainer = document.querySelector('.carousel-container');
        const heroCarouselSection = document.getElementById('inicio');
        
        if (heroCarouselSection) {
            if (!data.carousel || data.carousel.length === 0) {
                // FALLBACK: Inyectar 3 banners por defecto para que se vea lindo
                data.carousel = [
                    {
                        title: "El vistazo al mundo Apple está aquí",
                        subtitle: "Titanio. Tan resistente como ligero.",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2000&auto=format&fit=crop"
                    },
                    {
                        title: "Samsung Galaxy S24 Ultra",
                        subtitle: "La era de la Inteligencia Artificial",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1707028448897-5a23f1a070eb?q=80&w=2000&auto=format&fit=crop"
                    },
                    {
                        title: "Accesorios Premium",
                        subtitle: "Fundas, cargadores y auriculares",
                        link: "catalogo.html",
                        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=2000&auto=format&fit=crop"
                    }
                ];
            }
            
            // Renderizar siempre (ya sea con los reales o los de fallback)
            if (true) {
                heroCarouselSection.style.display = 'block';
                if (carouselContainer) {
                    carouselContainer.innerHTML = '';
                    data.carousel.forEach((slide, index) => {
                        // Generamos la estáuctura de un slide
                        carouselContainer.innerHTML += `
                            <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('${slide.image}') center/cover no-repeat; display: flex; align-items: center; justify-content: center; height: 100vh; position: absolute; top:0; left:0; right:0; bottom:0; overflow: hidden; perspective: 1000px;" onmousemove="
                                const rect = this.getBoundingClientRect();
                                const x = (event.clientX - rect.left) / rect.width - 0.5;
                                const y = (event.clientY - rect.top) / rect.height - 0.5;
                                const content = this.querySelector('.hero-content');
                                const bg = this.querySelector('.parallax-bg');
                                const phone1 = this.querySelector('.p-phone-1');
                                const phone2 = this.querySelector('.p-phone-2');
                                
                                if(content) content.style.transform = 'translateZ(50px) rotateX(' + (-y * 10) + 'deg) rotateY(' + (x * 10) + 'deg)';
                                if(bg) bg.style.transform = 'scale(1.1) translate(' + (-x * 30) + 'px, ' + (-y * 30) + 'px)';
                                if(phone1) phone1.style.transform = 'translate(' + (x * 80) + 'px, ' + (y * 80) + 'px) rotate(-15deg)';
                                if(phone2) phone2.style.transform = 'translate(' + (-x * 60) + 'px, ' + (-y * 60) + 'px) rotate(20deg)';
                            " onmouseleave="
                                const content = this.querySelector('.hero-content');
                                const bg = this.querySelector('.parallax-bg');
                                const phone1 = this.querySelector('.p-phone-1');
                                const phone2 = this.querySelector('.p-phone-2');
                                
                                if(content) content.style.transform = 'translateZ(0) rotateX(0) rotateY(0)';
                                if(bg) bg.style.transform = 'scale(1) translate(0, 0)';
                                if(phone1) phone1.style.transform = 'translate(0, 0) rotate(-15deg)';
                                if(phone2) phone2.style.transform = 'translate(0, 0) rotate(20deg)';
                            ">
                                
                                <div class="parallax-bg" style="position:absolute; top:0; left:0; right:0; bottom:0; background: inherit; z-index:0; transition: transform 0.2s ease-out; pointer-events:none;"></div>

                                <div class="hero-content" style="position: relative; z-index: 20; text-align: center; transform-style: preserve-3d; transition: transform 0.2s ease-out; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 90%; max-width: 600px;">
                                    <h2 class="carousel-title" style="text-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 4rem; margin-bottom: 1rem; font-weight: 800; color: white; transform: translateZ(30px);">${slide.title}</h2>
                                    <p class="carousel-subtitle" style="font-size: 1.4rem; margin-bottom: 3rem; color: #f0f0f0; transform: translateZ(20px);">${slide.subtitle}</p>
                                    <a href="${slide.link || 'catalogo.html'}" class="btn" style="background:linear-gradient(45deg, #555555, #333333); color:white; border:none; padding: 1.2rem 3rem; font-size: 1.2rem; font-weight: bold; border-radius: 50px; box-shadow: 0 10px 25px rgba(85, 85, 85, 0.5); transition: 0.3s; transform: translateZ(40px); display: inline-block;" onmouseover="this.style.transform='translateZ(50px) scale(1.05)'; this.style.boxShadow='0 15px 35px rgba(85, 85, 85, 0.7)';" onmouseout="this.style.transform='translateZ(40px) scale(1)'; this.style.boxShadow='0 10px 25px rgba(85, 85, 85, 0.5)';">
                                        Explorar Colección <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                                    </a>
                                </div>
                            </div>
                        `;
                    });

                    // Inicializar el nuevo carrusel
                    if (initHeroCarousel) {
                        initHeroCarousel();
                    if(initFlashCountdown) initFlashCountdown();
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error aplicando settings:", e);
    }
}
applyFrontendSettings();


// ==================== FAVORITOS (LISTA DE DESEOS) ====================
window.toggleFavorite = (id, event) => {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    let favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
    if(favs.includes(id)) {
        favs = favs.filter(f => f !== id.toString());
        showToast('Producto eliminado de favoritos', 'fa-heart-crack');
    } else {
        favs.push(id.toString());
        showToast('Producto añadido a favoritos', 'fa-heart');
    }
    localStorage.setItem('phoneSpotFavs', JSON.stringify(favs));
    
    document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
        if(favs.includes(id.toString())) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if(document.getElementById('favorites-container')) window.loadFavoritesUI();
};

document.addEventListener('mouseover', e => {
    const card = e.target.closest('.product-card');
    if (card && !card.querySelector('.fav-btn')) {
        const id = card.getAttribute('data-id');
        if(!id) return;
        const favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
        const isActive = favs.includes(id.toString()) ? 'active' : '';
        
        const btn = document.createElement('button');
        btn.className = `fav-btn ${isActive}`;
        btn.setAttribute('data-id', id);
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.onclick = (ev) => window.toggleFavorite(id, ev);
        
        card.style.position = 'relative';
        card.appendChild(btn);
    }
});

// Cargar UI en Perfil
window.loadFavoritesUI = async () => {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    
    const favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
    if (favs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column:1/-1;">Tu lista de deseos está vacía. ¡Explora el catálogo para agregar productos!</p>';
        return;
    }

    try {
        const res = await fetch(window.API_URL + '/api/products');
        const allProds = await res.json();
        const favProds = allProds.filter(p => favs.includes(p.id.toString()));

        if (favProds.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); grid-column:1/-1;">Los productos guardados ya no están disponibles.</p>';
            return;
        }

        container.innerHTML = '';
        favProds.forEach(prod => {
            const image = window.getFullImageUrl(prod.image_url) || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
            container.innerHTML += `
                <div class="favorite-item" data-id="${prod.id}" style="display: flex; align-items: center; gap: 1.5rem; background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-bottom: 1rem; flex-wrap: wrap;">
                    
                    <!-- Imagen -->
                    <a href="producto.html?id=${prod.id}" style="width: 100px; height: 100px; flex-shrink: 0; display: block;">
                        <img src="${image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; background: white; padding: 5px; border: 1px solid var(--border-color);">
                    </a>
                    
                    <!-- Info -->
                    <div style="flex: 1; min-width: 200px;">
                        <h4 style="margin: 0 0 0.5rem; font-size: 1.2rem;"><a href="producto.html?id=${prod.id}" style="color: var(--text-color); text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#ff4757'" onmouseout="this.style.color='var(--text-color)'">${prod.name}</a></h4>
                        <p style="margin: 0; font-weight: 900; color: var(--text-color); font-size: 1.3rem;">${window.formatPrice(Number(prod.price))}</p>
                    </div>

                    <!-- Botones -->
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\'#111\'" onmouseout="this.style.background=\'#555555\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> ${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                        
                        <button onclick="window.toggleFavorite('${prod.id}', event); window.loadFavoritesUI();" style="background: rgba(255, 71, 87, 0.1); color: #ff4757; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: 0.3s; font-size: 1.2rem;" title="Eliminar de favoritos" onmouseover="this.style.background='#ff4757'; this.style.color='white';" onmouseout="this.style.background='rgba(255, 71, 87, 0.1)'; this.style.color='#ff4757';">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } catch(e) {
        container.innerHTML = '<p style="color:red; grid-column:1/-1;">Error al cargar tus favoritos.</p>';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('favorites-container')) window.loadFavoritesUI();
});


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
        window.loadSidebarFavorites();
    }
};

window.loadSidebarFavorites = async () => {
    const container = document.getElementById('fav-sidebar-items');
    if (!container) return;
    
    const favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
    if (favs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 2rem 0; color: var(--text-muted);"><i class="fa-regular fa-heart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i><p>Tu lista de deseos está vacía.</p></div>';
        return;
    }

    try {
        const res = await fetch(window.API_URL + '/api/products');
        const allProds = await res.json();
        const favProds = allProds.filter(p => favs.includes(p.id.toString()));

        if (favProds.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align:center;">Los productos guardados ya no están disponibles.</p>';
            return;
        }

        container.innerHTML = '';
        favProds.forEach(prod => {
            const image = window.getFullImageUrl(prod.image_url) || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
            container.innerHTML += `
                <div class="favorite-sidebar-item" style="display: flex; gap: 1rem; background: var(--card-bg); padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid var(--border-color); position: relative;">
                    <!-- Borrar absoluto -->
                    <button onclick="window.toggleFavorite('${prod.id}', event); window.loadSidebarFavorites();" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 71, 87, 0.1); color: #ff4757; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;" title="Eliminar" onmouseover="this.style.background='#ff4757'; this.style.color='white';" onmouseout="this.style.background='rgba(255, 71, 87, 0.1)'; this.style.color='#ff4757';"><i class="fa-solid fa-trash" style="font-size: 0.8rem;"></i></button>

                    <!-- Imagen -->
                    <a href="producto.html?id=${prod.id}" style="width: 80px; height: 80px; flex-shrink: 0; display: block; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color);">
                        <img src="${image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: contain; background: white;">
                    </a>
                    
                    <!-- Info -->
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <h4 style="margin: 0 20px 0.5rem 0; font-size: 1rem; line-height: 1.2;"><a href="producto.html?id=${prod.id}" style="color: var(--text-color); text-decoration: none; transition: 0.2s;" onmouseover="this.style.color='#ff4757'" onmouseout="this.style.color='var(--text-color)'">${prod.name}</a></h4>
                        <p style="margin: 0 0 0.5rem 0; font-weight: 900; color: var(--text-color); font-size: 1.1rem;">${window.formatPrice(Number(prod.price))}</p>
                        
                        <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\'#111\'" onmouseout="this.style.background=\'#555555\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> ${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            `;
        });
    } catch(e) {
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar tus favoritos.</p>';
    }
};


// ==================== CUENTA REGRESIVA DE OFERTAS ====================
initFlashCountdown = () => {
    const cdContainer = document.getElementById('flash-countdown');
    if (!cdContainer) return;
    
    // Obtener fecha final desde la DB o usar un fallback de 3 días si no hay
    let endDateStr = window.phoneSpotSettings.flash_end_date;
    if (!endDateStr) {
        // Fallback: 3 days from now
        const d = new Date();
        d.setDate(d.getDate() + 3);
        endDateStr = d.toISOString();
    }
    
    const endDate = new Date(endDateStr).getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            cdContainer.style.display = 'none';
            // Hide the entire offers section
            const offersSection = document.getElementById('ofertas');
            if (offersSection) {
                offersSection.style.display = 'none';
            }
            return;
        }
        
        cdContainer.style.display = 'flex';
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if(document.getElementById('cd-days')) document.getElementById('cd-days').innerText = days.toString().padStart(2, '0');
        if(document.getElementById('cd-hours')) document.getElementById('cd-hours').innerText = hours.toString().padStart(2, '0');
        if(document.getElementById('cd-mins')) document.getElementById('cd-mins').innerText = minutes.toString().padStart(2, '0');
        if(document.getElementById('cd-secs')) document.getElementById('cd-secs').innerText = seconds.toString().padStart(2, '0');
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
};

// Start countdown once frontend settings are applied
document.addEventListener('DOMContentLoaded', () => {
    // Note: It's better to call it after applyFrontendSettings completes.
    // I will hook into it.
});


window.currentCoupon = null;
window.applyCoupon = () => {
    const code = document.getElementById('coupon-input')?.value.trim().toUpperCase();
    const msg = document.getElementById('coupon-msg');
    
    if (!code) {
        window.currentCoupon = null;
        if(msg) { msg.innerText = ''; }
        renderCheckout();
        return;
    }
    
    // Hardcoded demo coupons or you can fetch from settings
    const settings = window.phoneSpotSettings || {};
    const coupons = settings.coupons || [];
    
    const found = coupons.find(c => c.code === code);
    if (found) {
        window.currentCoupon = found;
        msg.style.color = '#2ecc71';
        msg.innerText = '¡Cupón aplicado exitosamente!';
    } else {
        window.currentCoupon = null;
        msg.style.color = '#e74c3c';
        msg.innerText = 'Cupón inválido o expirado.';
    }
    renderCheckout();
};


window.initFadeObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
};
document.addEventListener('DOMContentLoaded', () => {
    if (window.initFadeObserver) window.initFadeObserver();
});


    
    

// Fallback WhatsApp Button (En caso de que falle la carga de settings o tarde mucho)
setTimeout(() => {
    if (!document.getElementById('wa-float-btn')) {
        const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
        const waBtn = document.createElement('a');
        waBtn.id = 'wa-float-btn';
        waBtn.href = `https://wa.me/${waPhone}?text=${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}`;
        waBtn.className = 'whatsapp-float fade-up visible';
        waBtn.target = '_blank';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        document.body.appendChild(waBtn);
    }
}, 1000);

// ==================== DYNAMIC SHIPPING QUOTES ====================
if (window.location.pathname.includes('checkout.html')) {
    const btnCotizar = document.getElementById('btn-cotizar');
    const zipInput = document.getElementById('chk-zip');
    const container = document.getElementById('shipping-options-container');
    
    if (btnCotizar && zipInput && container) {
        btnCotizar.addEventListener('click', async () => {
            const zip = zipInput.value.trim();
            if (!zip) return showToast('Ingresa tu código postal primero', 'fa-triangle-exclamation');
            
            btnCotizar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            container.innerHTML = '<div style="color:#555;">Calculando mejores tarifas con Zipnova...</div>';
            
            try {
                const res = await fetch(window.API_URL + '/api/shipping/quote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ zip_code: zip, items: cart })
                });
                const data = await res.json();
                
                if (data.success && data.options) {
                    let html = '';
                    data.options.forEach((opt, idx) => {
                        html += `
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px;">
                                <input type="radio" name="shipping_method" value="${opt.id}" data-cost="${opt.cost}" data-name="${opt.name}" style="accent-color: var(--text-color);" ${idx === 0 ? 'checked' : ''}>
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: var(--text-color);">${opt.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Tiempo estimado: ${opt.time}</div>
                                </div>
                                <div style="font-weight: bold; color: var(--text-color);">
                                    ${opt.cost === 0 ? 'Gratis' : window.formatArs(opt.cost)}
                                </div>
                            </label>
                        `;
                    });
                    container.innerHTML = html;
                    
                    // Attach event listeners to new radios
                    document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                        radio.addEventListener('change', () => {
                            if(typeof renderCheckout === 'function') renderCheckout();
                        });
                    });
                    
                    // Re-render checkout to update total
                    if(typeof renderCheckout === 'function') renderCheckout();
                    
                } else {
                    container.innerHTML = '<div style="color:red;">Error al cotizar. Intenta nuevamente.</div>';
                }
            } catch (e) {
                container.innerHTML = '<div style="color:red;">Error de conexión.</div>';
            }
            btnCotizar.innerHTML = 'Cotizar';
        });
    }
}


// ==================== COOKIES BANNER ====================
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookies_accepted')) {
        const cookieBanner = document.createElement('div');
        cookieBanner.innerHTML = `
            <div id="cookie-banner" style="position: fixed; bottom: 20px; left: 20px; right: 20px; max-width: 600px; margin: 0 auto; background: var(--card-bg); border: 1px solid var(--border-color); box-shadow: 0 15px 30px rgba(0,0,0,0.15); padding: 20px; border-radius: 12px; z-index: 9999; display: flex; flex-direction: column; gap: 15px; font-size: 0.9rem; color: var(--text-color); transform: translateY(150%); transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fa-solid fa-cookie-bite" style="font-size: 2rem; color: #d35400;"></i>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; font-size: 1rem;">Usamos Cookies 🍪</h4>
                        <p style="margin: 0; color: var(--text-muted); line-height: 1.4;">Utilizamos cookies propias y de terceros para mejorar tu experiencia de compra y mostrarte ofertas relevantes. Al continuar navegando, aceptas nuestra política de privacidad.</p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <a href="terminos.html" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); padding: 8px 15px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center;">Ver Políticas</a>
                    <button id="accept-cookies" style="background: var(--text-color); color: var(--bg-color); border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">Entendido</button>
                </div>
            </div>
        `;
        document.body.appendChild(cookieBanner);
        
        setTimeout(() => {
            document.getElementById('cookie-banner').style.transform = 'translateY(0)';
        }, 1500);
        
        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookies_accepted', 'true');
            document.getElementById('cookie-banner').style.transform = 'translateY(150%)';
            setTimeout(() => {
                document.getElementById('cookie-banner').remove();
            }, 600);
        });
    }
});
// ========================================================


// ==================== REGISTRATION LOGIC WITH CAPTCHA & CONFIRM ====================
let isHuman = false;

window.addEventListener('DOMContentLoaded', () => {
    // Captcha Logic
    const slider = document.getElementById('captcha-slider');
    const container = document.getElementById('captcha-container');
    const bg = document.getElementById('captcha-bg');
    const text = document.getElementById('captcha-text');
    
    if (slider && container) {
        let isDragging = false;
        let startX = 0;
        let maxDrag = container.offsetWidth - slider.offsetWidth - 10; // 10px padding
        
        slider.addEventListener('mousedown', (e) => {
            if(isHuman) return;
            isDragging = true;
            startX = e.clientX || e.touches?.[0].clientX;
        });
        
        slider.addEventListener('touchstart', (e) => {
            if(isHuman) return;
            isDragging = true;
            startX = e.touches[0].clientX;
        });

        const onMove = (clientX) => {
            if (!isDragging) return;
            let diff = clientX - startX;
            if (diff < 0) diff = 0;
            if (diff > maxDrag) diff = maxDrag;
            
            slider.style.left = (diff + 5) + 'px';
            bg.style.width = (diff + 20) + 'px';
            
            if (diff >= maxDrag - 5) {
                // Success
                isDragging = false;
                isHuman = true;
                slider.innerHTML = '<i class="fa-solid fa-check" style="color: #00a650;"></i>';
                text.innerHTML = '<span style="color: white; font-weight: bold; position:relative; z-index: 3;">¡Verificado!</span>';
                bg.style.width = '100%';
            }
        };

        window.addEventListener('mousemove', (e) => onMove(e.clientX));
        window.addEventListener('touchmove', (e) => onMove(e.touches?.[0].clientX));

        const onUp = () => {
            if (!isDragging) return;
            isDragging = false;
            if (!isHuman) {
                slider.style.left = '5px';
                bg.style.width = '0';
            }
        };

        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
    }
});


// ==================== GOOGLE LOGIN ====================
window.handleGoogleLogin = () => {
    // Para que funcione con un botón personalizado, usamos el flujo implícito
    // pero como GIS restringe los botones personalizados para ID tokens, usamos una API estándar o el One Tap.
    // Usaremos google.accounts.oauth2.initTokenClient para obtener el perfil de forma segura
    
    if (typeof google === 'undefined') {
        return showToast('Google no está cargado. Revisa tu conexión.', 'fa-triangle-exclamation');
    }
    
    const client = google.accounts.oauth2.initTokenClient({
        client_id: '31583713582-ur3n2o5b9or6anv24mac34e69r35bauu.apps.googleusercontent.com',
        scope: 'email profile',
        callback: async (response) => {
            if (response.error) {
                console.error(response);
                return showToast('Error al conectar con Google', 'fa-triangle-exclamation');
            }
            
            showToast('Conectando con el servidor...', 'fa-spinner fa-spin');
            
            try {
                // Enviar token al backend
                const res = await fetch(window.API_URL + '/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: response.access_token })
                });
                
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('phoneSpotToken', data.token);
                    localStorage.setItem('phoneSpotRole', data.role);
                    showToast('¡Ingreso exitoso!', 'fa-check');
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    setTimeout(() => {
                        if (redirect) window.location.href = redirect;
                        else window.location.href = data.role === 'admin' ? 'admin.html' : 'perfil.html';
                    }, 1500);

                } else {
                    showToast(data.error || 'Error en el servidor', 'fa-triangle-exclamation');
                }
            } catch (err) {
                showToast('Error de conexión', 'fa-triangle-exclamation');
            }
        },
    });
    client.requestAccessToken();
};


// Preserve Auth Redirect params
window.addEventListener('DOMContentLoaded', () => {
    const authLink = document.getElementById('auth-switch-link');
    if (authLink) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        if (redirect) {
            authLink.href = authLink.getAttribute('href') + '?redirect=' + redirect;
        }
    }
});


window.addEventListener('DOMContentLoaded', () => {
    const adminLinks = document.querySelectorAll('.footer-admin-link');
    if (localStorage.getItem('phoneSpotRole') === 'admin') {
        adminLinks.forEach(link => link.style.display = 'inline-block');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        setTimeout(() => showToast('¡Cuenta verificada! Ya puedes iniciar sesión.', 'fa-check-circle'), 500);
    } else if (urlParams.get('verified') === 'already') {
        setTimeout(() => showToast('Tu cuenta ya estaba verificada. Inicia sesión.', 'fa-info-circle'), 500);
    }
});


window.updateCardVariant = function(el) {
    const card = el.closest('.product-card');
    if (!card) return;
    
    try {
        const info = JSON.parse(unescape(card.dataset.stockInfo || '{}'));
        if (!info.variants || info.variants.length === 0) return;

        const colorSel = card.querySelector('.var-select[data-type="color"]');
        const capSel = card.querySelector('.var-select[data-type="capacity"]');
        const ramSel = card.querySelector('.var-select[data-type="ram"]');
        const battSel = card.querySelector('.var-select[data-type="batt"]');

        let currentColor = colorSel ? colorSel.value : '';
        let currentCap = capSel ? capSel.value : '';
        let currentRam = ramSel ? ramSel.value : '';
        let currentBatt = battSel ? battSel.value : '';

        const typeTriggered = el && el.tagName === 'SELECT' ? el.dataset.type : null;

        if (typeTriggered === 'color' || !typeTriggered) {
            if (capSel) {
                const availableCaps = [...new Set(info.variants.filter(v => !currentColor || v.color === currentColor).map(v => v.capacity))].filter(Boolean);
                if (availableCaps.length > 0) {
                    if (!availableCaps.includes(currentCap)) currentCap = availableCaps[0];
                    capSel.innerHTML = availableCaps.map(c => `<option value="${c}">Cap: ${c}</option>`).join('');
                    capSel.value = currentCap;
                }
            }
        }

        if (typeTriggered === 'color' || typeTriggered === 'capacity' || !typeTriggered) {
            if (ramSel) {
                const availableRams = [...new Set(info.variants.filter(v => (!currentColor || v.color === currentColor) && (!currentCap || v.capacity === currentCap)).map(v => v.ram))].filter(Boolean);
                if (availableRams.length > 0) {
                    if (!availableRams.includes(currentRam)) currentRam = availableRams[0];
                    ramSel.innerHTML = availableRams.map(r => `<option value="${r}">RAM: ${r}</option>`).join('');
                    ramSel.value = currentRam;
                }
            }
        }
        
        if (typeTriggered === 'color' || typeTriggered === 'capacity' || typeTriggered === 'ram' || !typeTriggered) {
            if (battSel) {
                const availableBatts = [...new Set(info.variants.filter(v => (!currentColor || v.color === currentColor) && (!currentCap || v.capacity === currentCap) && (!currentRam || v.ram === currentRam)).map(v => v.batt))].filter(Boolean);
                if (availableBatts.length > 0) {
                    if (!availableBatts.includes(currentBatt)) currentBatt = availableBatts[0];
                    battSel.innerHTML = availableBatts.map(b => `<option value="${b}">Bat: ${b}</option>`).join('');
                    battSel.value = currentBatt;
                }
            }
        }

        const finalColor = colorSel ? colorSel.value : '';
        const finalCap = capSel ? capSel.value : '';
        const finalRam = ramSel ? ramSel.value : '';
        const finalBatt = battSel ? battSel.value : '';

        const selectedVariant = [finalColor, finalCap, finalRam, finalBatt ? 'Bat: '+finalBatt : ''].filter(Boolean).join(' - ');
        card.dataset.selectedVariant = selectedVariant;

        const v = info.variants.find(vx => {
            const vName = [vx.color, vx.capacity, vx.ram, vx.batt ? 'Bat: '+vx.batt : ''].filter(Boolean).join(' - ');
            return vName === selectedVariant;
        });

        const stockMsg = card.querySelector('.card-variant-stock');
        const priceEl = card.querySelector('.card-price');
        const btn = card.querySelector('.add-to-cart-btn');
        const mainBadge = card.querySelector('.card-main-badge');

        const basePrice = parseFloat(card.dataset.price);

        if (v) {
            if (priceEl) {
                const finalPrice = v.price ? parseFloat(v.price) : basePrice;
                priceEl.innerHTML = window.formatPrice(finalPrice);
            }
            if (v.stock > 0) {
                if (stockMsg) stockMsg.innerHTML = '<span style="color:#2ecc71"><i class="fa-solid fa-check"></i> Stock: ' + v.stock + '</span>';
                if (btn) {
                    btn.disabled = false;
                    btn.style.background = btn.style.background.includes('555') ? '#555555' : '';
                    if(btn.style.cursor === 'not-allowed') btn.style.cursor = 'pointer';
                    btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito';
                }
                if(mainBadge && mainBadge.innerText === 'AGOTADO') mainBadge.style.display = 'none';
            } else {
                if (stockMsg) stockMsg.innerHTML = '<span style="color:#ff4757"><i class="fa-solid fa-times"></i> Sin stock</span>';
                if (btn) {
                    btn.disabled = true;
                    btn.style.background = '#ccc';
                    btn.style.cursor = 'not-allowed';
                    btn.innerHTML = 'Sin Stock';
                }
                if(mainBadge && mainBadge.innerText === 'AGOTADO') mainBadge.style.display = 'block';
            }
        } else {
            if (stockMsg) stockMsg.innerHTML = '<span style="color:#ff4757"><i class="fa-solid fa-times"></i> Agotado</span>';
            if (btn) {
                btn.disabled = true;
                btn.style.background = '#ccc';
                btn.style.cursor = 'not-allowed';
                btn.innerHTML = 'Sin Stock';
            }
        }
    } catch(e) {
        console.error(e);
    }
};

// ==================== ASESOR DE COMPRA ====================
window.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('advisor-start');
    const intro = document.querySelector('.advisor-intro');
    const flow = document.getElementById('advisor-flow');
    const questionContainer = document.getElementById('advisor-question');
    const resultsContainer = document.getElementById('advisor-results');
    if (!startButton || !intro || !flow || !questionContainer || !resultsContainer) return;

    const categoryQuestion = {
        id: 'category',
        title: '¿Qué estás buscando hoy?',
        options: [
            { value: 'celulares', icon: 'fa-mobile-screen-button', label: 'Un celular' },
            { value: 'notebooks', icon: 'fa-laptop', label: 'Una notebook' },
            { value: 'tablets', icon: 'fa-tablet-screen-button', label: 'Una tablet' },
            { value: 'accesorios', icon: 'fa-headphones', label: 'Accesorios' },
            { value: 'all', icon: 'fa-layer-group', label: 'Quiero explorar todo' }
        ]
    };

    const phoneQuestions = [
        {
            id: 'usage',
            title: '¿Para qué lo vas a usar principalmente?',
            options: [
                { value: 'camera', icon: 'fa-camera', label: 'Fotos y videos' },
                { value: 'gaming', icon: 'fa-gamepad', label: 'Juegos y potencia' },
                { value: 'work', icon: 'fa-briefcase', label: 'Trabajo y estudio' },
                { value: 'basic', icon: 'fa-comments', label: 'Uso diario' }
            ]
        },
        {
            id: 'system',
            title: '¿Tenés alguna preferencia de sistema?',
            options: [
                { value: 'apple', icon: 'fa-brands fa-apple', label: 'Prefiero Apple' },
                { value: 'android', icon: 'fa-brands fa-android', label: 'Prefiero Android' },
                { value: 'any', icon: 'fa-mobile-screen-button', label: 'Me da igual' }
            ]
        },
        {
            id: 'budget',
            title: '¿Cuál es tu presupuesto aproximado?',
            options: [
                { value: '300000', icon: 'fa-wallet', label: 'Hasta $300.000' },
                { value: '500000', icon: 'fa-wallet', label: 'Hasta $500.000' },
                { value: '750000', icon: 'fa-wallet', label: 'Hasta $750.000' },
                { value: 'none', icon: 'fa-gem', label: 'Quiero ver lo mejor disponible' }
            ]
        }
    ];

    const budgetQuestion = {
        id: 'budget',
        title: '¿Cuál es tu presupuesto aproximado?',
        options: [
            { value: '300000', icon: 'fa-wallet', label: 'Hasta $300.000' },
            { value: '500000', icon: 'fa-wallet', label: 'Hasta $500.000' },
            { value: '750000', icon: 'fa-wallet', label: 'Hasta $750.000' },
            { value: 'none', icon: 'fa-gem', label: 'Quiero ver lo mejor disponible' }
        ]
    };

    const getQuestionsForCategory = (category) => {
        if (category === 'celulares') return [categoryQuestion, ...phoneQuestions];

        const usageByCategory = {
            notebooks: {
                title: '¿Para qué la necesitás principalmente?',
                options: [
                    { value: 'work', icon: 'fa-briefcase', label: 'Trabajo y estudio' },
                    { value: 'gaming', icon: 'fa-gamepad', label: 'Potencia y juegos' },
                    { value: 'basic', icon: 'fa-envelope', label: 'Uso cotidiano' }
                ]
            },
            tablets: {
                title: '¿Para qué la vas a usar principalmente?',
                options: [
                    { value: 'work', icon: 'fa-pen-ruler', label: 'Estudio y trabajo' },
                    { value: 'camera', icon: 'fa-film', label: 'Contenido y entretenimiento' },
                    { value: 'basic', icon: 'fa-house', label: 'Uso diario' }
                ]
            },
            accesorios: {
                title: '¿Qué tipo de accesorio necesitás?',
                options: [
                    { value: 'audio', icon: 'fa-headphones', label: 'Audio y auriculares' },
                    { value: 'energy', icon: 'fa-bolt', label: 'Carga y energía' },
                    { value: 'protection', icon: 'fa-shield-halved', label: 'Fundas y protección' },
                    { value: 'wearables', icon: 'fa-clock', label: 'Smartwatches' },
                    { value: 'basic', icon: 'fa-boxes-stacked', label: 'Quiero ver todo' }
                ]
            },
            all: {
                title: '¿Qué priorizás?',
                options: [
                    { value: 'work', icon: 'fa-briefcase', label: 'Trabajo y estudio' },
                    { value: 'camera', icon: 'fa-camera', label: 'Fotos y entretenimiento' },
                    { value: 'gaming', icon: 'fa-gamepad', label: 'Potencia y juegos' },
                    { value: 'basic', icon: 'fa-layer-group', label: 'Ver opciones variadas' }
                ]
            }
        };
        return [categoryQuestion, { id: 'usage', ...usageByCategory[category] }, budgetQuestion];
    };

    const answers = {};
    let step = 0;
    let questions = [categoryQuestion];

    const escapeAdvisorHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const renderQuestion = () => {
        const question = questions[step];
        questionContainer.innerHTML = `
            <p class="advisor-step-label">Pregunta ${step + 1} de ${questions.length}</p>
            <h3 class="advisor-question-title">${question.title}</h3>
            <div class="advisor-options">
                ${question.options.map(option => `
                    <button class="advisor-option" type="button" data-advisor-answer="${option.value}">
                        <i class="${option.icon}"></i>${option.label}
                    </button>
                `).join('')}
            </div>
            ${step > 0 ? '<button class="advisor-back" type="button">Volver a la pregunta anterior</button>' : ''}
        `;
        const progress = flow.querySelector('.advisor-progress');
        progress.innerHTML = questions.map((_, index) => '<span></span>').join('');
        progress.querySelectorAll('span').forEach((item, index) => {
            item.classList.toggle('active', index <= step);
        });

        questionContainer.querySelectorAll('[data-advisor-answer]').forEach(button => {
            button.addEventListener('click', () => {
                answers[question.id] = button.dataset.advisorAnswer;
                if (question.id === 'category') {
                    questions = getQuestionsForCategory(answers.category);
                }
                if (step < questions.length - 1) {
                    step += 1;
                    renderQuestion();
                } else {
                    showRecommendations();
                }
            });
        });
        questionContainer.querySelector('.advisor-back')?.addEventListener('click', () => {
            step -= 1;
            renderQuestion();
        });
    };

    const productPrice = (product) => {
        const prices = [Number(product.price), ...(Array.isArray(product.variants) ? product.variants.map(variant => Number(variant.price)) : [])]
            .filter(price => Number.isFinite(price) && price > 0);
        return prices.length ? Math.min(...prices) : 0;
    };

    const productScore = (product) => {
        const category = String(product.category || 'celulares').toLowerCase();
        const name = String(product.name || '').toLowerCase();
        const brand = String(product.brand || '').toLowerCase();
        const specs = `${name} ${product.description || ''} ${(product.variants || []).map(variant => `${variant.capacity || ''} ${variant.ram || ''}`).join(' ')}`.toLowerCase();
        const priceArs = productPrice(product) * window.dolarValue;
        const capacity = Math.max(0, ...[...specs.matchAll(/(\d+)\s*(?:gb|tb)/g)].map(match => Number(match[1]) * (match[0].toLowerCase().includes('tb') ? 1024 : 1)));
        const ram = Math.max(0, ...[...specs.matchAll(/(?:ram\D{0,5})?(\d+)\s*gb/g)].map(match => Number(match[1])));
        let score = 10;

        if (answers.category && answers.category !== 'all') {
            score += category === answers.category ? 120 : -120;
        }

        if (answers.system === 'apple') score += brand.includes('apple') || name.includes('iphone') ? 100 : -100;
        if (answers.system === 'android') score += brand.includes('apple') || name.includes('iphone') ? -100 : 25;

        if (answers.usage === 'camera') {
            if (/iphone|galaxy|samsung|pixel|xiaomi|pro|max|ultra/.test(specs)) score += 22;
        }
        if (answers.usage === 'gaming') {
            if (/ultra|pro|max|gaming|snapdragon|dimensity/.test(specs)) score += 18;
            if (ram >= 8) score += 14;
            if (capacity >= 256) score += 8;
        }
        if (answers.usage === 'work') {
            if (ram >= 8) score += 14;
            if (capacity >= 256) score += 14;
            if (String(product.category || '').toLowerCase().includes('notebook')) score += 18;
        }
        if (answers.usage === 'basic') score += Math.max(0, 18 - priceArs / 25000);

        if (answers.category === 'accesorios') {
            if (answers.usage === 'audio' && /auricular|headphone|buds|jbl|audio/.test(specs)) score += 40;
            if (answers.usage === 'energy' && /cargador|cable|power|bater/.test(specs)) score += 40;
            if (answers.usage === 'protection' && /funda|case|vidrio|protector/.test(specs)) score += 40;
            if (answers.usage === 'wearables' && /watch|smartwatch|band/.test(specs)) score += 40;
        }

        if (answers.budget !== 'none') {
            const budget = Number(answers.budget);
            if (priceArs <= budget) score += 30 + ((budget - priceArs) / budget) * 6;
            else if (priceArs <= budget * 1.15) score += 3;
            else score -= 80;
        }
        return score;
    };

    const recommendationReason = () => {
        const labels = {
            camera: 'sus fotos y videos',
            gaming: 'rendimiento y juegos',
            work: 'trabajo y estudio',
            basic: 'el uso diario'
        };
        const categoryLabels = {
            celulares: 'celulares',
            notebooks: 'notebooks',
            tablets: 'tablets',
            accesorios: 'accesorios'
        };
        const categoryText = categoryLabels[answers.category];
        return categoryText
            ? `Seleccionamos ${categoryText} disponibles para ${labels[answers.usage] || 'lo que necesitás'}.`
            : `Una buena opción para ${labels[answers.usage] || 'vos'}.`;
    };

    const renderNoAdvisorMatches = () => {
        resultsContainer.innerHTML = `
            <h3>No tenemos productos disponibles para los filtros que buscaste</h3>
            <p>Probá ampliando el presupuesto, eligiendo otra categoría o explorá todo el catálogo.</p>
            <a class="advisor-catalog-link" href="catalogo.html?cat=all">Ver todo el catálogo</a>
            <button class="advisor-restart" type="button">Cambiar mi búsqueda</button>
        `;
        resultsContainer.querySelector('.advisor-restart').addEventListener('click', resetAdvisor);
    };

    const showRecommendations = async () => {
        flow.hidden = true;
        resultsContainer.hidden = false;
        resultsContainer.innerHTML = '<h3>Buscando tus mejores opciones...</h3><p>Estamos revisando el stock disponible.</p>';

        try {
            await window.dolarPromise;
            const response = await fetch(window.API_URL + '/api/products');
            const products = await response.json();
            if (!response.ok) throw new Error(products.error || 'No se pudo consultar el catálogo');

            const filteredProducts = products
                .filter(product => Number(product.stock) > 0 && productPrice(product) > 0)
                .filter(product => !answers.category || answers.category === 'all' || String(product.category || 'celulares').toLowerCase() === answers.category)
                .filter(product => {
                    const name = String(product.name || '').toLowerCase();
                    const brand = String(product.brand || '').toLowerCase();
                    const isApple = brand.includes('apple') || name.includes('iphone');
                    if (answers.system === 'apple') return isApple;
                    if (answers.system === 'android') return !isApple;
                    return true;
                })
                .filter(product => answers.budget === 'none' || productPrice(product) * window.dolarValue <= Number(answers.budget));

            if (!filteredProducts.length) {
                renderNoAdvisorMatches();
                return;
            }

            const picks = filteredProducts
                .map(product => ({ product, score: productScore(product) }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            resultsContainer.innerHTML = `
                <h3>Estas son nuestras recomendaciones para vos</h3>
                <p>${recommendationReason()} Todos los equipos mostrados tienen stock disponible.</p>
                <div class="advisor-product-grid">
                    ${picks.map(({ product }) => {
                        const image = window.getFullImageUrl(product.image_url) || 'uploads/PhoneSpot-trans.png';
                        return `
                            <article class="advisor-product">
                                <img src="${escapeAdvisorHtml(image)}" alt="${escapeAdvisorHtml(product.name)}">
                                <span class="advisor-product-brand">${escapeAdvisorHtml(product.brand || 'PhoneSpot')}</span>
                                <h4>${escapeAdvisorHtml(product.name)}</h4>
                                <p class="advisor-product-price">${window.formatPrice(productPrice(product))}</p>
                                <a href="producto.html?id=${encodeURIComponent(product.id)}">Ver equipo <i class="fa-solid fa-arrow-right"></i></a>
                            </article>
                        `;
                    }).join('')}
                </div>
                <button class="advisor-restart" type="button">Cambiar mis respuestas</button>
            `;
            resultsContainer.querySelector('.advisor-restart').addEventListener('click', resetAdvisor);
        } catch (error) {
            console.error('Error en el asesor de compra:', error);
            resultsContainer.innerHTML = `
                <h3>No pudimos cargar las recomendaciones</h3>
                <p>Podés explorar todos los equipos disponibles en el catálogo.</p>
                <a class="advisor-catalog-link" href="catalogo.html?cat=all">Ver catálogo</a>
                <button class="advisor-restart" type="button">Intentar de nuevo</button>
            `;
            resultsContainer.querySelector('.advisor-restart').addEventListener('click', resetAdvisor);
        }
    };

    const resetAdvisor = () => {
        Object.keys(answers).forEach(key => delete answers[key]);
        step = 0;
        questions = [categoryQuestion];
        resultsContainer.hidden = true;
        intro.hidden = false;
        flow.hidden = true;
    };

    startButton.addEventListener('click', () => {
        intro.hidden = true;
        resultsContainer.hidden = true;
        flow.hidden = false;
        renderQuestion();
        flow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

// ==================== COMPARADOR DE EQUIPOS ====================
window.addEventListener('DOMContentLoaded', () => {
    const compareStorageKey = 'phoneSpotCompareIds';
    const maxComparedProducts = 3;

    const getCompareIds = () => {
        try {
            const ids = JSON.parse(localStorage.getItem(compareStorageKey) || '[]');
            return Array.isArray(ids) ? [...new Set(ids.map(String))].slice(0, maxComparedProducts) : [];
        } catch (_) {
            return [];
        }
    };
    const setCompareIds = (ids) => localStorage.setItem(compareStorageKey, JSON.stringify([...new Set(ids.map(String))].slice(0, maxComparedProducts)));
    const escapeCompareHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const tray = document.createElement('aside');
    tray.className = 'compare-tray';
    tray.setAttribute('aria-live', 'polite');
    document.body.appendChild(tray);

    const renderCompareTray = () => {
        const ids = getCompareIds();
        if (!ids.length) {
            tray.classList.remove('visible');
            tray.innerHTML = '';
            return;
        }
        tray.classList.add('visible');
        tray.innerHTML = `
            <p><strong>${ids.length} equipo${ids.length === 1 ? '' : 's'} seleccionado${ids.length === 1 ? '' : 's'}</strong>
            Elegí hasta ${maxComparedProducts} para comparar.</p>
            <a href="comparar.html">Comparar <i class="fa-solid fa-arrow-right"></i></a>
        `;
    };

    const mountCompareButtons = (scope = document) => {
        scope.querySelectorAll?.('.product-card[data-id], .product-details[data-id]').forEach(card => {
            if (card.querySelector('[data-compare-product]')) return;
            const addToCartButton = card.querySelector('.add-to-cart-btn');
            if (!addToCartButton) return;
            const productId = String(card.dataset.id || '');
            if (!productId) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'compare-action';
            button.dataset.compareProduct = productId;
            button.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> Comparar equipo';
            addToCartButton.insertAdjacentElement('afterend', button);
        });
        const selected = new Set(getCompareIds());
        document.querySelectorAll('[data-compare-product]').forEach(button => {
            const isSelected = selected.has(String(button.dataset.compareProduct));
            button.classList.toggle('selected', isSelected);
            button.innerHTML = isSelected
                ? '<i class="fa-solid fa-check"></i> Agregado al comparador'
                : '<i class="fa-solid fa-scale-balanced"></i> Comparar equipo';
        });
    };

    document.addEventListener('click', event => {
        const button = event.target.closest('[data-compare-product]');
        if (!button) return;
        const productId = String(button.dataset.compareProduct || '');
        const ids = getCompareIds();
        const alreadySelected = ids.includes(productId);
        const nextIds = alreadySelected ? ids.filter(id => id !== productId) : [...ids, productId];

        if (!alreadySelected && ids.length >= maxComparedProducts) {
            showToast(`Podés comparar hasta ${maxComparedProducts} equipos a la vez.`, 'fa-scale-balanced');
            return;
        }
        setCompareIds(nextIds);
        renderCompareTray();
        mountCompareButtons();
        showToast(alreadySelected ? 'Equipo quitado del comparador' : 'Equipo agregado al comparador', alreadySelected ? 'fa-minus' : 'fa-check');
    });

    mountCompareButtons();
    renderCompareTray();
    new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) mountCompareButtons(node);
        }));
    }).observe(document.body, { childList: true, subtree: true });

    const comparePage = document.getElementById('compare-page-content');
    if (!comparePage) return;

    const productPrice = product => {
        const prices = [Number(product.price), ...(Array.isArray(product.variants) ? product.variants.map(variant => Number(variant.price)) : [])]
            .filter(price => Number.isFinite(price) && price > 0);
        return prices.length ? Math.min(...prices) : 0;
    };
    const uniqueValues = (product, key) => [...new Set((Array.isArray(product.variants) ? product.variants : []).map(variant => variant[key]).filter(Boolean))];
    const conditionFor = product => {
        const description = String(product.description || '');
        const match = description.match(/^\[Condición:\s*([^\]]+)\]/i);
        return match ? match[1] : 'Nuevo, caja sellada';
    };
    const displayValue = value => value && value.length ? escapeCompareHtml(Array.isArray(value) ? value.join(' · ') : value) : '<span class="compare-no-data">No especificado</span>';

    const renderComparePage = async () => {
        comparePage.innerHTML = '<p class="compare-loading">Cargando los equipos disponibles...</p>';
        try {
            await window.dolarPromise;
            const response = await fetch(window.API_URL + '/api/products');
            const products = await response.json();
            if (!response.ok) throw new Error(products.error || 'No se pudieron cargar los productos');

            const selectedIds = getCompareIds();
            const selectedProducts = selectedIds.map(id => products.find(product => String(product.id) === id)).filter(Boolean);
            const availableProducts = products.filter(product => !selectedIds.includes(String(product.id)) && Number(product.stock) > 0);

            if (!selectedProducts.length) {
                comparePage.innerHTML = `
                    <div class="compare-empty">
                        <h3>Elegí equipos para compararlos</h3>
                        <p>Desde el catálogo, tocá “Comparar equipo” en los modelos que quieras evaluar.</p>
                        <a href="catalogo.html?cat=all">Ir al catálogo</a>
                    </div>
                `;
                return;
            }

            comparePage.innerHTML = `
                <div class="compare-controls">
                    <label class="compare-picker-label">${selectedProducts.length < maxComparedProducts ? 'Sumar otro equipo' : 'Ya seleccionaste el máximo de equipos'}
                        <span class="compare-picker-row">
                            <select id="compare-picker" ${selectedProducts.length >= maxComparedProducts ? 'disabled' : ''}>
                                <option value="">Seleccionar equipo disponible</option>
                                ${availableProducts.map(product => `<option value="${product.id}">${escapeCompareHtml(product.name)} — ${window.formatPrice(productPrice(product))}</option>`).join('')}
                            </select>
                            <button id="compare-add" type="button" ${selectedProducts.length >= maxComparedProducts ? 'disabled' : ''}>Agregar</button>
                        </span>
                    </label>
                    <button class="compare-clear" id="compare-clear" type="button">Limpiar comparación</button>
                </div>
                <div class="compare-table-wrap">
                    <table class="compare-table">
                        <thead><tr>
                            <th>Comparar</th>
                            ${selectedProducts.map(product => {
                                const image = window.getFullImageUrl(product.image_url) || 'uploads/PhoneSpot-trans.png';
                                return `<th><div class="compare-product-head">
                                    <button class="compare-remove" type="button" data-compare-remove="${product.id}" aria-label="Quitar ${escapeCompareHtml(product.name)}"><i class="fa-solid fa-xmark"></i></button>
                                    <img src="${escapeCompareHtml(image)}" alt="${escapeCompareHtml(product.name)}">
                                    <small>${escapeCompareHtml(product.brand || 'PhoneSpot')}</small>
                                    <h3>${escapeCompareHtml(product.name)}</h3>
                                    <a href="producto.html?id=${encodeURIComponent(product.id)}">Ver ficha <i class="fa-solid fa-arrow-right"></i></a>
                                </div></th>`;
                            }).join('')}
                        </tr></thead>
                        <tbody>
                            ${[
                                ['Precio final', product => `<span class="compare-price">${window.formatPrice(productPrice(product))}</span>`],
                                ['Categoría', product => displayValue(product.category)],
                                ['Condición', product => displayValue(conditionFor(product))],
                                ['Capacidad', product => displayValue(uniqueValues(product, 'capacity'))],
                                ['Memoria RAM', product => displayValue(uniqueValues(product, 'ram'))],
                                ['Batería', product => displayValue(uniqueValues(product, 'batt'))],
                                ['Colores disponibles', product => displayValue(uniqueValues(product, 'color'))],
                                ['Disponibilidad', product => Number(product.stock) > 0 ? `<span class="compare-stock"><i class="fa-solid fa-check-circle"></i> Stock disponible</span>` : '<span class="compare-no-data">Sin stock</span>']
                            ].map(([label, formatter]) => `<tr><td>${label}</td>${selectedProducts.map(product => `<td>${formatter(product)}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            comparePage.querySelector('#compare-add')?.addEventListener('click', () => {
                const id = comparePage.querySelector('#compare-picker').value;
                if (!id) return;
                setCompareIds([...getCompareIds(), id]);
                renderCompareTray();
                mountCompareButtons();
                renderComparePage();
            });
            comparePage.querySelector('#compare-clear')?.addEventListener('click', () => {
                setCompareIds([]);
                renderCompareTray();
                mountCompareButtons();
                renderComparePage();
            });
            comparePage.querySelectorAll('[data-compare-remove]').forEach(button => button.addEventListener('click', () => {
                setCompareIds(getCompareIds().filter(id => id !== String(button.dataset.compareRemove)));
                renderCompareTray();
                mountCompareButtons();
                renderComparePage();
            }));
        } catch (error) {
            console.error('Error cargando el comparador:', error);
            comparePage.innerHTML = '<div class="compare-empty"><h3>No pudimos cargar la comparación</h3><p>Intentá actualizar la página o volvé al catálogo.</p><a href="catalogo.html?cat=all">Ir al catálogo</a></div>';
        }
    };

    renderComparePage();
});

document.addEventListener('submit', async (event) => {
    const form = event.target.closest('#stock-alert-form');
    if (!form) return;
    event.preventDefault();
    const email = form.querySelector('#stock-alert-email')?.value.trim();
    const productId = form.dataset.productId;
    const button = form.querySelector('button[type="submit"]');
    if (!email || !productId || !button) return;

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando';
    try {
        const response = await fetch(window.API_URL + '/api/stock-alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, email })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo guardar el aviso');
        form.innerHTML = '<strong style="color:#168344;"><i class="fa-solid fa-check-circle"></i> Listo, te avisaremos por email cuando vuelva a estar disponible.</strong>';
    } catch (error) {
        button.disabled = false;
        button.innerHTML = '<i class="fa-regular fa-bell"></i> Avisarme';
        showToast(error.message, 'fa-triangle-exclamation');
    }
});
