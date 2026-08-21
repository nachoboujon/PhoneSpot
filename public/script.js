window.phoneSpotSettings = window.phoneSpotSettings || {};

// ==================== CONFIGURACIÓN DE API ====================
// Cambia 'http://localhost:3000' por la URL de tu servidor en producción (ej. 'https://tu-backend.onrender.com')
window.API_URL = '';
// ==============================================================


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
if (window.location.pathname.includes('checkout.html') && !localStorage.getItem('token')) {
    window.location.href = 'login.html?redirect=checkout.html';
}
window.goToCheckout = (e) => {
    if (e) e.preventDefault();
    if (!localStorage.getItem('token')) {
        showToast('Debes iniciar sesión para comprar', 'fa-lock');
        setTimeout(() => window.location.href = 'login.html?redirect=checkout.html', 1500);
    } else {
        window.location.href = 'checkout.html';
    }
};
// ====================================================

window.formatPrice = (usdPrice) => {
    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');
};
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
        if (isWholesale) finalPrice -= wholesaleDiscount;
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
    const threshold = settings.free_shipping_threshold;
    
    if (fsText && fsBar && threshold > 0) {
        document.getElementById('free-shipping-container').style.display = 'block';
        if (total >= threshold) {
            fsText.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#555555;"></i> ¡¿Tienes envío GRATIS!';
            fsBar.style.width = '100%';
            fsBar.style.background = '#555555';
        } else {
            const missing = threshold - total;
            const pct = Math.min((total / threshold) * 100, 100);
            fsText.innerHTML = `Te faltan <strong>${window.formatPrice(missing)}</strong> para Envío Gratis`;
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
        if (isWholesale) finalPrice -= wholesaleDiscount;
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
        if (isWholesale) finalPrice -= wholesaleDiscount;
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
    const threshold = settings.free_shipping_threshold;
    
    // Si supera el umbral, envío gratis
    const isFreeShipping = threshold > 0 && total >= threshold;

    const zipInput = document.getElementById('chk-zip');
    const userZip = zipInput ? zipInput.value.trim() : '';
    
    const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
    let shippingName = 'Envío';
    
    if (selectedShipping) {
        shippingCost = parseFloat(selectedShipping.dataset.cost) || 0;
        shippingName = selectedShipping.dataset.name || 'Envío';
        
        // Envío local sin cargo
        if (userZip === '3283' || userZip === '3280') {
            shippingCost = 0;
            shippingName = 'Envío Local (Sin Cargo)';
        } else if (isFreeShipping) {
            shippingCost = 0;
            shippingName = 'Envío (Bonificado por Promoción)';
        }
        
        checkoutItems.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #ccc; font-size: 0.9rem; color: var(--text-color);">
                <span>${shippingName}</span>
                <span style="${shippingCost === 0 ? 'color:#555555; font-weight:bold;' : ''}">${shippingCost === 0 ? 'Gratis' : window.formatPrice(shippingCost)}</span>
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

            const cardHTML = `
                <div class="product-card ${prod.is_offer ? 'offer-card' : ''}" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}">
                    ${prod.stock <= 0 ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#333; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">AGOTADO</div>` : (prod.is_offer ? `<div class="badge" style="position:absolute; top: 15px; left: 15px; background:#ff4757; color:white; padding:0.4rem 0.8rem; font-size:0.8rem; font-weight:bold; border-radius:8px; z-index:10;">OFERTA 🔥</div>` : '')}
                    <a href="producto.html?id=${prod.id}">
                        <img src="${image}" alt="${prod.name}">
                    </a>
                    <h4><a href="producto.html?id=${prod.id}" style="color:inherit; text-decoration:none;">${prod.name}</a></h4>
                    <div class="product-rating">
                        
                        <span>(4.8)</span>
                    </div>
                    <p class="price">
                        ${prod.is_offer ? `<span class="old-price">$${oldPrice.toFixed(0)}</span>` : ''}
                        ${priceFormatted}
                    </p>
                    <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ''}>
                        ${prod.stock <= 0 ? 'Sin Stock' : (prod.is_offer ? 'Aprovechar Oferta' : 'Añadir al carrito')}
                    </button>
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
        showToast('Error al conectar con la base de datos. Verifica que server.js está corriendo.', 'fa-triangle-exclamation');
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
            let selectedVariant = '';
            
            const activeColor = card.querySelector('.var-btn.active[data-type="color"]');
            const activeCap = card.querySelector('.var-btn.active[data-type="capacity"]');
            const activeRam = card.querySelector('.var-btn.active[data-type="ram"]');

            const selColorBtn = card.querySelector('.variant-color-btn.selected');
            const selCapBtn = card.querySelector('.variant-cap-btn.selected');
            const selRamBtn = card.querySelector('.variant-ram-btn.selected');
            
            let color = '', cap = '', ram = '';

            if (activeColor || activeCap || activeRam) {
                color = activeColor ? activeColor.dataset.val : '';
                cap = activeCap ? activeCap.dataset.val : '';
                ram = activeRam ? activeRam.dataset.val : '';
            } else if (selColorBtn || selCapBtn || selRamBtn) {
                color = selColorBtn ? selColorBtn.dataset.color : '';
                cap = selCapBtn ? selCapBtn.dataset.cap : '';
                ram = selRamBtn ? selRamBtn.dataset.ram : '';
            }
            
            if (color || cap || ram) {
                selectedVariant = [color, cap, ram].filter(Boolean).join(' - ');
                // No modificar name, dejamos que el carrito maneje variant_name visualmente
                // O si preferimos: name = `${name} (${selectedVariant})`;
                // Lo mantenemos como estaba:
                name = `${name} (${selectedVariant})`; 
            }
            
            let imgEl = card.querySelector('img:not([style*="display:none"])') || card.querySelector('img');
            const img = imgEl ? imgEl.src : '';
            
            // Evaluar stock máximo
            let maxStock = 1; // Fallback
            try {
                if (card.dataset.stockInfo) {
                    const info = JSON.parse(unescape(card.dataset.stockInfo));
                    if (selectedVariant && info.variants && info.variants.length > 0) {
                        const v = info.variants.find(vx => {
                            const vName = [vx.color, vx.capacity, vx.ram].filter(Boolean).join(' - ');
                            return vName === selectedVariant;
                        });
                        maxStock = v ? v.stock : 0;
                    } else {
                        maxStock = info.stock;
                    }
                }
            } catch(e) {
                console.error('Error parsing stock info', e);
            }

            addToCart({id, name, price, img, variant_name: selectedVariant || null, maxStock});
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
                    const b = (p.brand || '').toLowerCase();
                    if (!selectedBrands.includes(b)) return false;
                }

                
                // Conditions Filter
                if (selectedConditions.length > 0) {
                    const desc = (p.description || '').toLowerCase();
                    const name = (p.name || '').toLowerCase();
                    const combined = name + " " + desc;
                    
                    let matchesCond = false;
                    if (selectedConditions.includes('nuevo') && !combined.includes('usado') && !combined.includes('reacondicionado') && !combined.includes('seminuevo')) matchesCond = true;
                    if (selectedConditions.includes('swap_americano') && (combined.includes('swap') || combined.includes('americano') || combined.includes('usado') || combined.includes('seminuevo'))) matchesCond = true;
                    if (selectedConditions.includes('reacondicionado') && (combined.includes('reacondicionado') || combined.includes('refurbished'))) matchesCond = true;
                    
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

                const cardHTML = `
                    <div class="product-card" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="position:relative; display:flex; flex-direction:column; background: var(--card-bg); border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s;">
                        ${prod.stock <= 0 ? `<span class="badge" style="position:absolute; top:10px; left:10px; background:#333; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">AGOTADO</span>` : (hasOffer ? `<span class="badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-${discount}%</span>` : '')}
                        
                        ${favIcon}

                        <a href="producto.html?id=${prod.id}" style="display:block; height: 180px; margin-bottom: 1rem;">
                            <img src="${image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s;">
                        </a>
                        <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 0.5rem;">${prod.brand || 'PhoneSpot'}</p>
                        <h4 style="margin: 0 0 1rem; font-size: 1.1rem; flex:1;"><a href="producto.html?id=${prod.id}" style="color: var(--text-color); text-decoration: none;">${prod.name}</a></h4>
                        
                        <div style="margin-bottom: 1.5rem;">
                            ${hasOffer ? `<p style="color: var(--text-muted); text-decoration: line-through; font-size: 0.9rem; margin: 0;">${window.formatPrice(Number(prod.old_price))}</p>` : ''}
                            <p style="color: var(--text-color); font-weight: 900; font-size: 1.4rem; margin: 0;">${window.formatPrice(Number(prod.price))}</p>
                        </div>
                        
                        <button class="btn btn-block add-to-cart-btn" ${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : 'style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background=\'#111\'" onmouseout="this.style.background=\'#555555\'"'}>
                            <i class="fa-solid fa-cart-shopping"></i> ${prod.stock <= 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
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
                fetch(`${window.API_URL}/api/products/${productId}`).then(r => r.json()),
                fetch(`${window.API_URL}/api/reviews/${productId}`).then(r => r.json()).catch(() => [])
            ]).then(([prod, reviews]) => {
                if (prod.error) {
                    singleProductContainer.innerHTML = `<p style="color:#ff4757; font-size:1.2rem;">${prod.error}</p>`;
                    return;
                }
                
                document.title = `${prod.name} | PhoneSpot`;
                const image = window.getFullImageUrl(prod.image_url) || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
                const isOutOfStock = prod.stock <= 0;
                const oldPrice = prod.is_offer ? `<p class="old-price" style="text-decoration:line-through; color: var(--text-muted); margin-bottom:0;">${window.formatPrice(prod.price * 1.2)}</p>` : '';

                let variantsHTML = '';
                let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    
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
                            
                            <p id="variant-stock-msg" style="font-size:0.95rem; margin-top:0.5rem; font-weight:bold;"></p>
                        </div>
                    `;
                }

                // Calcular rating de reviews
                let avgRating = 4.8;
                let numReviews = reviews.length > 0 ? reviews.length : 24;
                if(reviews.length > 0) {
                    avgRating = (reviews.reduce((a,b) => a + b.rating, 0) / reviews.length).toFixed(1);
                }

                let starsHtml = '';
                for(let i=1; i<=5; i++) {
                    if (i <= Math.floor(avgRating)) starsHtml += '';
                    else if (i - avgRating < 1) starsHtml += '';
                    else starsHtml += '';
                }

                singleProductContainer.innerHTML = `
                    <div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">
                        <div class="product-details" data-id="${prod.id}" data-price="${prod.price}" data-stock-info="${escape(JSON.stringify({stock: prod.stock, variants: prod.variants || []}))}" style="display:grid; grid-template-columns:1fr 1.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.06);">
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
                                
                                <div class="product-rating" style="justify-content: flex-start; margin-bottom: 1.5rem; font-size: 1rem; display: flex; gap: 0.2rem; align-items: center; color:#f5c518;">
                                    
                                    <span style="margin-left: 0.5rem; color:#555; font-size:0.9rem;">(${avgRating}) - ${numReviews} Reseñas</span>
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

                                <div style="padding-top: 1.5rem; border-top: 1px solid #eee;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 1rem; color:#1d1d1f;">Descripción del producto</h4>
                                    <p style="line-height:1.7; color: #555; font-size:0.95rem;">${prod.description}</p>
                                </div>

                                <div style="margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border-radius: 12px; display:flex; flex-direction:column; gap:0.8rem;">
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-shield-halved" style="color:#0071e3;"></i></div>
                                        <span>12 meses de <strong>garantía oficial</strong></span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-rotate-left" style="color:#0071e3;"></i></div>
                                        <span>Devolución <strong>gratuita en 30 días</strong></span>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px; font-size:0.9rem; color: #333;">
                                        <div style="width:36px; height:36px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);"><i class="fa-solid fa-truck-fast" style="color:#0071e3;"></i></div>
                                        <span><strong>Envío inmediato</strong> a todo el país</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // AHORA SÍ CONECTAMOS LOS EVENTOS, DESPUÉS DE INNER HTML
                if (hasVariants) {
                    window.checkVariantStock = (prodArg) => {
                        const colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        const capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        const ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        
                        const selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        const selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        const selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;

                        let stockToUse = prodArg.stock;
                        let priceToUse = prodArg.price; // Start with base price
                        if (variants.length > 0) {
                            const v = variants.find(x => 
                                (!selectedColor || x.color === selectedColor) && 
                                (!selectedCap || x.capacity === selectedCap) &&
                                (!selectedRam || x.ram === selectedRam)
                            );
                            if (v) {
                                stockToUse = parseInt(v.stock);
                                if (v.price && !isNaN(parseFloat(v.price))) priceToUse = parseFloat(v.price);
                            } else {
                                stockToUse = 0;
                            }
                        }

                        const btn = document.querySelector('.add-to-cart-btn');
                        const stockLabel = document.getElementById('variant-stock-msg');
                        
                        if (stockToUse <= 0) {
                            if(btn) {
                                btn.innerHTML = '<i class="fa-solid fa-box-open"></i> Sin Stock';
                                btn.disabled = true;
                                btn.style.background = '#ccc';
                                btn.style.cursor = 'not-allowed';
                            }
                            if (stockLabel) stockLabel.innerHTML = '<span style="color:#ff4757;"><i class="fa-solid fa-times-circle"></i> Combinación agotada</span>';
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

                    
                    window.checkVariantStock = (prodArg) => {
                        let colorBtn = document.querySelector('.var-btn.active[data-type="color"]');
                        let capBtn = document.querySelector('.var-btn.active[data-type="capacity"]');
                        let ramBtn = document.querySelector('.var-btn.active[data-type="ram"]');
                        
                        let selectedColor = colorBtn ? colorBtn.getAttribute('data-val') : null;
                        let selectedCap = capBtn ? capBtn.getAttribute('data-val') : null;
                        let selectedRam = ramBtn ? ramBtn.getAttribute('data-val') : null;

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
                                (!selectedRam || x.ram === selectedRam)
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
                    calcBtn.addEventListener('click', () => {
                        const zip = calcZip.value.trim();
                        if (!zip) return;
                        
                        zipMsg.style.display = 'block';
                        zipMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculando...';
                        
                        setTimeout(() => {
                            let simulatedCost = 8500;
                            if (zip.startsWith('1') || zip.startsWith('2')) simulatedCost = 8500; // Buenos Aires
                            else if (zip.startsWith('5')) simulatedCost = 10500; // Córdoba
                            else simulatedCost = 13500; // Resto del país
                            
                            const freeThreshold = (window.phoneSpotSettings && window.phoneSpotSettings.free_shipping_threshold) || 1500000;
                            if (prod.price >= freeThreshold) {
                                zipMsg.innerHTML = '<i class="fa-solid fa-check-circle" style="color:#555555;"></i> ¡Envío GRATIS a tu código postal!';
                            } else {
                                zipMsg.innerHTML = `<i class="fa-solid fa-truck"></i> Envío estimado: <strong>${window.formatPrice(simulatedCost)}</strong>`;
                            }
                        }, 800);
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
        fetch(window.API_URL + '/api/products')
            .then(res => res.json())
            .then(prods => {
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
            if (!email || !name || !address) {
                showToast('Por favor completa tu correo, nombre y dirección.', 'fa-circle-exclamation');
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
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        // Lógica de ciudad
        const citySelect = document.getElementById('chk-city');
        const labelEfectivo = document.getElementById('label-efectivo');
        const radioEfectivo = document.querySelector('input[value="efectivo"]');
        const radioMp = document.querySelector('input[value="mercadopago"]');

        const shippingOptions = document.getElementById('shipping-options');
        const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');

        if (citySelect && labelEfectivo) {
            citySelect.addEventListener('change', (e) => {
                const city = e.target.value;
                if (city === 'Otra') {
                    labelEfectivo.style.opacity = '0.5';
                    labelEfectivo.title = 'Solo disponible para San José, Colón, Villa Elisa y C. del Uruguay';
                    radioEfectivo.disabled = true;
                    radioMp.checked = true;
                    if(shippingOptions) shippingOptions.style.display = 'block';
                } else {
                    labelEfectivo.style.opacity = '1';
                    labelEfectivo.title = '';
                    radioEfectivo.disabled = false;
                    if(shippingOptions) shippingOptions.style.display = 'none';
                }
                renderCheckout();
            });
        }

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
            const threshold = settings.free_shipping_threshold;
            
            // Calcular total del carrito para saber si aplica envío gratis
            const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const isFreeShipping = threshold > 0 && cartTotal >= threshold;

            if (city === 'Otra') {
                const selShip = document.querySelector('input[name="shipping_method"]:checked');
                if(selShip) {
                    
                    if (selShip.value === 'andreani') shipping_cost = settings.shipping_andreani || 12000;
                    else if (selShip.value === 'andreani_sucursal') shipping_cost = Math.max(0, (settings.shipping_andreani || 12000) - 3000);
                    else if (selShip.value === 'correo_sucursal') shipping_cost = Math.max(0, (settings.shipping_correo || 8500) - 2000);
                    else shipping_cost = settings.shipping_correo || 8500;

                    
                    if (isFreeShipping) {
                        shipping_cost = 0;
                    }
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
                    if (isWholesale) finalPrice -= wholesaleDiscount;
                    return acc + (finalPrice * item.quantity);
                }, 0);
                const orderTotal = total;
                const finalShippingCost = (window.currentCoupon && window.currentCoupon.type === 'shipping') ? 0 : shipping_cost;
                const finalTotalArs = Math.round(orderTotal * window.dolarValue) + finalShippingCost;
                
                showToast('Procesando orden...', 'fa-spinner fa-spin');

                const response = await fetch(window.API_URL + '/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost: finalShippingCost, discount_code: window.currentCoupon ? window.currentCoupon.code : null, discount_amount: (window.currentCoupon && window.currentCoupon.type === 'fixed') ? window.currentCoupon.value : ((window.currentCoupon && window.currentCoupon.type === 'percent') ? (total * (window.currentCoupon.value / 100)) : 0), dolar_value: window.dolarValue })
                });

                const data = await response.json();
                
                if (response.ok) {
                    
                    if (paymentMethod === 'efectivo') {
                        // Generar mensaje de WhatsApp
                        let wpMsg = `Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.${window.getFullImageUrl(item.img || item.image || item.image_url)}n${window.getFullImageUrl(item.img || item.image || item.image_url)}n*Nombre:* ${customer_name}${window.getFullImageUrl(item.img || item.image || item.image_url)}n*Dirección:* ${shipping_address}${window.getFullImageUrl(item.img || item.image || item.image_url)}n*Total a pagar:* $${finalTotalArs.toLocaleString('es-AR')}${window.getFullImageUrl(item.img || item.image || item.image_url)}n`;
                        if (isWholesale) wpMsg += `*Beneficio:* Precio Mayorista Activado (-${wholesaleDiscount} USD c/u)${window.getFullImageUrl(item.img || item.image || item.image_url)}n`;
                        wpMsg += `${window.getFullImageUrl(item.img || item.image || item.image_url)}n*Productos:*${window.getFullImageUrl(item.img || item.image || item.image_url)}n`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += `- ${item.quantity}x ${item.name} (${window.formatPrice(finalPrice)})${window.getFullImageUrl(item.img || item.image || item.image_url)}n`;
                        });
                        wpMsg += `${window.getFullImageUrl(item.img || item.image || item.image_url)}nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).`;
                        
                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = `https://wa.me/${wpPhone}?text=${encodeURIComponent(wpMsg)}`;
                        cart = [];
                        saveCart();
                        if (typeof updateCartUI === 'function') updateCartUI();
                        
                        showToast('¡Orden registrada! Redirigiendo a WhatsApp...', 'fa-check');
                        setTimeout(() => window.location.href = wpUrl, 2000);
                    } else if (paymentMethod === 'mercadopago') {
                        
                        showToast('Redirigiendo a Mercado Pago...', 'fa-spinner fa-spin');
                        // Call MP endpoint
                        try {
                            const mpRes = await fetch(window.API_URL + '/api/mercadopago/preference', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ items: cart, customer_email, total_ars: finalTotalArs })
                            });
                            const mpData = await mpRes.json();
                            if (mpData.init_point) {
                                cart = [];
                                saveCart();
                                window.location.href = mpData.init_point;
                            } else {
                                showToast('Aviso: El admin debe colocar su MP_ACCESS_TOKEN en el archivo .env', 'fa-triangle-exclamation');
                            }
                        } catch(e) {
                            showToast('Error conectando con MP', 'fa-times');
                        }

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
                    showToast('Cuenta creada. Inicia sesión.', 'fa-check');
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    setTimeout(() => window.location.href = 'login.html' + (redirect ? '?redirect=' + redirect : ''), 1500);

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
                const stock = parseInt(row.querySelector('.var-stock').value) || 0;
                if(color && capacity) {
                    variantsArray.push({ color, capacity, ram, stock });
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
                                    </div>
                                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                        <label style="font-size:0.8rem;">Precio (USD):</label>
                                        <input type="number" id="price-${p.id}" value="${p.price}" style="width:80px; padding:0.2rem;">
                                        
                                        <label style="font-size:0.8rem;">Stock:</label>
                                        <input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px; padding:0.2rem;" >
                                        
                                        <button onclick="updateProductBasic(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Guardar Precio</button>
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
                const price = document.getElementById(`price-${id}`).value;
                const stock = document.getElementById(`stock-${id}`).value;
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(`${window.API_URL}/api/products/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ price, stock })
                    });
                    if(res.ok) {
                        showToast('Precio actualizado', 'fa-check');
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
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#f4f5f7; padding:0.5rem; border-radius:4px;">
                        <span style="font-size:0.85rem;">${v.color} - ${v.capacity} - ${v.ram} (Stock: ${v.stock})${v.price ? ' - <strong style="color:#0071e3">US$ ' + v.price + '</strong>' : ''}</span>
                        <button onclick="removeVariantFromProduct(${id}, ${index})" style="background:transparent; border:none; color:#e74c3c; cursor:pointer;"><i class="fa-solid fa-times"></i></button>
                    </div>
                `).join('');
            };

            window.addVariantToProduct = async (id) => {
                const color = document.getElementById(`new-color-${id}`).value.trim();
                const cap = document.getElementById(`new-cap-${id}`).value.trim();
                const ram = document.getElementById(`new-ram-${id}`).value.trim();
                const stock = parseInt(document.getElementById(`new-vstock-${id}`).value) || 0;
                const rawPrice = document.getElementById(`new-vprice-${id}`).value;
                const price = rawPrice ? parseFloat(rawPrice) : null;
                
                if (!color || !cap) return showToast('Color y Capacidad son obligatorios', 'fa-exclamation');

                let variants = window[`adminProductVariants_${id}`] || [];
                variants.push({ color, capacity: cap, ram, stock, price });
                
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
                                      <h5 style="margin:0;">Orden #${o.id.substring(0,8)} <span style="color:#555555;">($${o.total})</span></h5>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-calendar"></i> ${new Date(o.created_at).toLocaleString()}</p>
                                      <p style="margin:0; font-size:0.85rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> Envío: ${o.shipping_address}</p>
                                  </div>
                                  <div style="flex:2; display:flex; gap:1rem; align-items:center; background: var(--gray-bg); padding:0.5rem; border-radius:8px;">
                                      <div>
                                          <label style="font-size:0.8rem; display:block;">Estado:</label>
                                          <select id="status-${o.id}" style="padding:0.2rem; border-radius:4px;">
                                              <option value="pending" ${o.status==='pending'?'selected':''}>Pendiente</option>
                                              <option value="completed" ${o.status==='completed'?'selected':''}>Completado</option>
                                              <option value="shipped" ${o.status==='shipped'?'selected':''}>Enviado</option>
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
                  const totalVenEl = document.getElementById('stat-total-sales');
                  const totalItemsEl = document.getElementById('stat-total-items');
                  const topProdEl = document.getElementById('stat-top-product');

                  if(totalRevEl) totalRevEl.innerText = '$' + totalRevenue.toLocaleString('es-AR');
                  if(totalVenEl) totalVenEl.innerText = orders.length;
                  if(totalItemsEl) totalItemsEl.innerText = totalItems;
                  
                  if(topProdEl && Object.keys(productSales).length > 0) {
                      const topProduct = Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b);
                      topProdEl.innerText = topProduct + ' (' + productSales[topProduct] + ')';
                  }

              } catch(e) {
                  console.error(e);
              }
          };
          window.loadAdminOrders();
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
            window.removeBannerMessage = (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
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

            const saveSettings = async () => {
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
                            <button type="button" class="btn-danger" onclick="deleteSlide(${index})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                });
            };

            window.deleteSlide = (index) => {
                if(confirm('¿íSeguro que deseas eliminar está slide?')) {
                    currentSettings.carousel.splice(index, 1);
                    renderAdminCarouselList();
                    saveSettings();
                }
            };

            if(bannerForm) {
                bannerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    // top_banner ya se actualiza en tiempo real con updateBannerMessage()
                if(document.getElementById('set-flash-date')) {
                    currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                }
                if(document.getElementById('set-brands-list')) {
                    currentSettings.brands_list = document.getElementById('set-brands-list').value;
                }
                    saveSettings();
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
                    const fileInput = document.getElementById('set-car-img');
                    if(fileInput.files.length === 0) return showToast('Selecciona una imagen primero', 'fa-image');
                    
                    const btn = carouselForm.querySelector('button[type="submit"]');
                    const oldBtnHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
                    btn.disabled = true;

                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);

                    try {
                        const token = localStorage.getItem('phoneSpotToken');
                        const res = await fetch(window.API_URL + '/api/upload', {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token },
                            body: formData
                        });
                        const data = await res.json();
                        
                        if (!res.ok) throw new Error(data.error);

                        if(!currentSettings.carousel) currentSettings.carousel = [];
                        currentSettings.carousel.push({
                            title: document.getElementById('set-car-title').value,
                            subtitle: document.getElementById('set-car-subtitle').value,
                            link: document.getElementById('set-car-link').value,
                            image: data.url
                        });
                        carouselForm.reset();
                        renderAdminCarouselList();
                        saveSettings();
                        showToast('Slide añadido con éxito');
                    } catch(err) {
                        showToast('Error al subir imagen', 'fa-triangle-exclamation');
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
                heroCarouselSection.style.display = 'none';
            } else {
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

                                <!-- Floating Decoratives -->
                                ${(slide.title.toLowerCase().includes('iphone') || slide.title.toLowerCase().includes('celular') || slide.title.toLowerCase().includes('samsung')) ? `
                                <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb315?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-1" style="position:absolute; top: 15%; left: 10%; transform: rotate(-15deg); border-radius: 20px; border: 4px solid #333; width: 200px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80" alt="Phone" class="p-phone-2" style="position:absolute; bottom: 20%; right: 15%; transform: rotate(20deg); border-radius: 20px; border: 4px solid #333; width: 150px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                ` : (slide.title.toLowerCase().includes('notebook') || slide.title.toLowerCase().includes('laptop') || slide.title.toLowerCase().includes('macbook')) ? `
                                <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=400&q=80" alt="Notebook" class="p-phone-1" style="position:absolute; top: 20%; left: 8%; transform: rotate(-10deg); border-radius: 12px; width: 250px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                <img src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=400&q=80" alt="Laptop" class="p-phone-2" style="position:absolute; bottom: 15%; right: 10%; transform: rotate(15deg); border-radius: 12px; width: 200px; z-index: 10; transition: transform 0.2s ease-out; pointer-events:none; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));">
                                ` : ``
                                }
                                <!-- Glowing background elements -->
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; height: 400px; background: rgba(85, 85, 85, 0.4); filter: blur(100px); border-radius: 50%; z-index: 1; pointer-events:none;"></div>
                                
                                <div class="hero-content" style="position: relative; z-index: 20; text-align: center; transform-style: preserve-3d; transition: transform 0.2s ease-out; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); padding: 4rem; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.3);">
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
                                    ${opt.cost === 0 ? 'Gratis' : window.formatPrice(opt.cost)}
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
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
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
