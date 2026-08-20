window.phoneSpotSettings = window.phoneSpotSettings || {};
// ==================== DOLAR BLUE ====================
window.dolarValue = 1400; // Fallback
window.dolarPromise = fetch('https://dolarapi.com/v1/dolares/blue')
    .then(res => res.json())
    .then(data => { if (data && data.venta) window.dolarValue = data.venta + 5; })
    .catch(e => console.error('Error fetching dolar', e));

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
    if (rawCart) cart = JSON.parse(rawCart) || [];
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

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart(); // Solo ítil si estámás en carrito.html
    if (typeof renderSideCart === 'function') renderSideCart();
}

function changeQuantity(id, newQuantity) {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        renderCart();
        if (typeof renderSideCart === 'function') renderSideCart();
    }
}

async function renderSideCart() { 
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

        await window.dolarPromise; 
    const sideContainer = document.getElementById('side-cart-items');
    const sideTotal = document.getElementById('side-cart-total');
    if (!sideContainer || !sideTotal) return;

    sideContainer.innerHTML = '';
    let total = 0;
    
    // MAYORISTA LOGIC
    let totalQuantity = 0;
    cart.forEach(item => totalQuantity += item.quantity);
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;

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
                        <button onclick="changeQuantity('${item.id}', ${item.quantity - 1})" style="border:none; background:none; cursor:pointer; width:20px;">-</button>
                        <span style="font-size:0.8rem; font-weight:bold;">${item.quantity}</span>
                        <button onclick="changeQuantity('${item.id}', ${item.quantity + 1})" style="border:none; background:none; cursor:pointer; width:20px;">+</button>
                    </div>
                    <span class="side-cart-remove" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash"></i> Quitar</span>
                </div>
            </div>
        `;
    });
    
    // Inject wholesale banner above total
    let bannerHtml = '';
    if (isWholesale) {
        bannerHtml = `<div id="wholesale-banner-side" style="background:#e3fce0; color:#2e7d32; padding: 10px; text-align:center; font-size:0.9rem; font-weight:bold; border-radius:8px; margin-bottom: 10px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Mayorista aplicado! (-$5 USD c/u)
                      </div>`;
    } else {
        const remaining = 3 - totalQuantity;
        bannerHtml = `<div id="wholesale-banner-side" style="background:#fff3e0; color:#e65100; padding: 10px; text-align:center; font-size:0.8rem; font-weight:bold; border-radius:8px; margin-bottom: 10px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega ${remaining} equipo${remaining > 1 ? 's' : ''} más para activar Precio Mayorista (-$5 USD c/u)
                      </div>`;
    }
    
    // Remove old banner to avoid duplicates
    const oldBanner = document.getElementById('wholesale-banner-side');
    if (oldBanner) oldBanner.remove();
    
    sideContainer.insertAdjacentHTML('afterend', bannerHtml);
    
    sideTotal.innerText = `${window.formatPrice(total)}`;

    const fsText = document.getElementById('free-shipping-text');
    const fsBar = document.getElementById('free-shipping-bar');
    const settings = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
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
            fsText.innerHTML = `Te faltan <strong>$${window.formatPrice(missing)}</strong> para Envío Gratis`;
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
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Tu carrito está vacío.</p>';
        cartTotalElement.innerText = '$0';
        return;
    }

    // Wholesale banner injection
    if (isWholesale) {
        cartItemsContainer.innerHTML += `<div style="background:#e3fce0; color:#2e7d32; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px;">
                        <i class="fa-solid fa-tags"></i> ¡Descuento Mayorista activado! Estás ahorrando $5 USD por cada equipo.
                      </div>`;
    } else {
        const remaining = 3 - totalQuantity;
        cartItemsContainer.innerHTML += `<div style="background:#fff3e0; color:#e65100; padding: 15px; text-align:center; font-size:1rem; font-weight:bold; border-radius:8px; margin-bottom: 20px; border: 1px dashed #ffb74d;">
                        <i class="fa-solid fa-box-open"></i> Agrega ${remaining} equipo${remaining > 1 ? 's' : ''} más a tu pedido para desbloquear el Precio Mayorista (-$5 USD c/u)
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
                    <input type="number" value="${item.quantity}" min="1" onchange="changeQuantity('${item.id}', parseInt(this.value))">
                </div>
            </div>
            <div class="item-price" style="display:flex; flex-direction:column; align-items:flex-end;">
                <strong style="font-size: 1.2rem; color: var(--text-color);">${window.formatPrice(finalPrice * item.quantity)}</strong>
                ${isWholesale ? `<span style="color:#2e7d32; font-size: 0.8rem;">( -$5 USD aplicado )</span>` : ''}
            </div>
            <button onclick="removeFromCart('${item.id}')" style="background:none; color: var(--text-muted); padding:0; width:auto; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

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
    const isWholesale = totalQuantity >= 3;
    const wholesaleDiscount = 5;
    
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
    const settings = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
    const threshold = settings.free_shipping_threshold;
    
    // Si supera el umbral, envío gratis
    const isFreeShipping = threshold > 0 && total >= threshold;

    const citySelect = document.getElementById('chk-city');
    if (citySelect && citySelect.value === 'Otra') {
        const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
        if (selectedShipping) {
            shippingCost = selectedShipping.value === 'andreani' 
                ? (settings.shipping_andreani || 12000) 
                : (settings.shipping_correo || 8500);
            
            if (isFreeShipping) {
                shippingCost = 0;
            }
            
            checkoutItems.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #ccc; font-size: 0.9rem; color: var(--text-color);">
                    <span>Envío (${selectedShipping.value === 'andreani' ? 'Andreani' : 'Correo Argentino'})</span>
                    <span style="${isFreeShipping ? 'color:#555555; font-weight:bold;' : ''}">${isFreeShipping ? 'Gratis' : window.formatPrice(shippingCost)}</span>
                </div>
            `;
        }
    } else {
        checkoutItems.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px dashed #ccc; font-size: 0.9rem; color: #555555;">
                <span>Envío Local</span>
                <span style="font-weight:bold;">Gratis</span>
            </div>
        `;
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

    try {
        await window.dolarPromise;
        const response = await fetch('http://localhost:3000/api/products');
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
            const image = prod.image_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80';

            const cardHTML = `
                <div class="product-card ${prod.is_offer ? 'offer-card' : ''}" data-id="${prod.id}">
                    ${prod.is_offer ? `<div class="badge">OFERTA</div>` : ''}
                    <a href="producto.html?id=${prod.id}">
                        <img src="${image}" alt="${prod.name}">
                    </a>
                    <h4><a href="producto.html?id=${prod.id}" style="color:inherit; text-decoration:none;">${prod.name}</a></h4>
                    <div class="product-rating">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        <span>(4.8)</span>
                    </div>
                    <p class="price">
                        ${prod.is_offer ? `<span class="old-price">$${oldPrice.toFixed(0)}</span>` : ''}
                        ${priceFormatted}
                    </p>
                    <a href="#" class="btn btn-block add-to-cart-btn">
                        ${prod.is_offer ? 'Aprovechar Oferta' : 'Añadir al carrito'}
                    </a>
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

        // Si después de todo no hay ofertas, mostrar mensaje
        if(offersCount === 0 && offersContainer) {
            offersContainer.innerHTML = '<p style="color: var(--text-muted); text-align:center; grid-column:1/-1;">Hoy no hay ofertas relámpago. ¡íVuelve mañana!</p>';
        }
    } catch (err) {
        console.error("Error cargando productos:", err);
        showToast('Error al conectar con la base de datos. Verifica que server.js está corriendo.', 'fa-triangle-exclamation');
    }
}

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

    // Inyectar Botón Flotante de WhatsApp Global
    if (!document.getElementById('wa-float-btn')) {
        const waBtn = document.createElement('a');
        waBtn.id = 'wa-float-btn';
        waBtn.href = 'https://wa.me/5493447416011'; // Reemplazar
        waBtn.className = 'whatsapp-float';
        waBtn.target = '_blank';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        document.body.appendChild(waBtn);
    }

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
                <a href="checkout.html" class="btn btn-block" style="text-align:center;">Finalizar ¡Compra</a>
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
            const priceStr = card.querySelector('.price').innerText.replace('$', '').split(' ').pop();
            const price = parseFloat(priceStr);

            // Verificar si hay una variante seleccionada
            let selectedVariant = '';
            const selColorBtn = card.querySelector('.variant-color-btn.selected');
            const selCapBtn = card.querySelector('.variant-cap-btn.selected');
            const selRamBtn = card.querySelector('.variant-ram-btn.selected');
            
            if (selColorBtn || selCapBtn || selRamBtn) {
                const color = selColorBtn ? selColorBtn.dataset.color : '';
                const cap = selCapBtn ? selCapBtn.dataset.cap : '';
                const ram = selRamBtn ? selRamBtn.dataset.ram : '';
                selectedVariant = [color, cap, ram].filter(Boolean).join(' - ');
                name = `${name} (${selectedVariant})`; 
            }
            
            let imgEl = card.querySelector('img:not([style*="display:none"])') || card.querySelector('img');
            const img = imgEl ? imgEl.src : '';

            addToCart({id, name, price, img, variant_name: selectedVariant || null});
        }
    });

    // Lógica para página de Catálogo (catálogo.html)
    
    const fullCatalogContainer = document.getElementById('full-catalog-container');
    if (fullCatalogContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const initialCat = urlParams.get('cat') || 'all';

        let allCatalogProducts = [];
        let selectedBrands = initialCat !== 'all' && ['apple','samsung','motorola','xiaomi'].includes(initialCat) ? [initialCat] : [];
        let selectedCategories = initialCat !== 'all' && ['celulares','notebooks','tablets','accesorios'].includes(initialCat) ? [initialCat] : [];
                let onlyAmericanos = false;
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

                // Price Filter
                
                // Offers Filter
                if (onlyOffers && !p.is_offer) {
                    return false;
                }

                // Americanos Filter
                if (onlyAmericanos) {
                    const str = (p.name + " " + (p.description||'')).toLowerCase();
                    if (!str.includes('americano') && !str.includes('usa') && !str.includes('libre de f')) return false;
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
                const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                const hasOffer = prod.old_price && Number(prod.old_price) > Number(prod.price);
                const discount = hasOffer ? Math.round((1 - (Number(prod.price)/Number(prod.old_price))) * 100) : 0;
                
                // Build Fav Icon
                const favs = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotFavs') || '[]'); } catch(e) { return []; } })();
                const isActive = favs.includes(prod.id.toString()) ? 'active' : '';
                const favIcon = `<button class="fav-btn ${isActive}" data-id="${prod.id}" onclick="window.toggleFavorite('${prod.id}', event)" style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); border:none; width:35px; height:35px; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.1); cursor:pointer; color: ${isActive ? '#ff4757' : '#ccc'}; transition: 0.3s; z-index:10;"><i class="fa-solid fa-heart"></i></button>`;

                const cardHTML = `
                    <div class="product-card" data-id="${prod.id}" style="position:relative; display:flex; flex-direction:column; background: var(--card-bg); border-radius: 12px; padding: 1.5rem; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s;">
                        ${hasOffer ? `<span class="badge" style="position:absolute; top:10px; left:10px; background:#ff4757; color:white; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.8rem; z-index:10;">-${discount}%</span>` : ''}
                        
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
                        
                        <button onclick="
                            const cart = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotCart') || '[]'); } catch(e) { return []; } })();
                            const existing = cart.find(i => i.id == '${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '${prod.id}', name: '${prod.name}', price: ${prod.price}, image: '${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " class="btn btn-block" style="background: #555555; color: white; border: none; padding: 0.8rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#555555'">
                            <i class="fa-solid fa-cart-shopping"></i> Agregar al Carrito
                        </button>
                    </div>
                `;
                fullCatalogContainer.innerHTML += cardHTML;
            });
        };

        window.dolarPromise.then(() => fetch('http://localhost:3000/api/products')).then(res => res.json())
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

                    const americanoFilter = document.getElementById('americano-filter');
                    if (americanoFilter) {
                        americanoFilter.addEventListener('change', (e) => {
                            onlyAmericanos = e.target.checked;
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
                fetch(`http://localhost:3000/api/products/${productId}`).then(r => r.json()),
                fetch(`http://localhost:3000/api/reviews/${productId}`).then(r => r.json()).catch(() => [])
            ]).then(([prod, reviews]) => {
                if (prod.error) {
                    singleProductContainer.innerHTML = `<p style="color:#ff4757; font-size:1.2rem;">${prod.error}</p>`;
                    return;
                }
                
                document.title = `${prod.name} | PhoneSpot`;
                const image = prod.image_url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';
                const isOutOfStock = prod.stock <= 0;
                const oldPrice = prod.is_offer ? `<p class="old-price" style="text-decoration:line-through; color: var(--text-muted); margin-bottom:0;">$${window.formatPrice(prod.price * 1.2)}</p>` : '';

                let variantsHTML = '';
                let hasVariants = prod.variants && prod.variants.length > 0;
                if (hasVariants) {
                    const uniqueColors = [...new Set(prod.variants.map(v => v.color))].filter(Boolean);
                    const uniqueCaps = [...new Set(prod.variants.map(v => v.capacity))].filter(Boolean);
                    const uniqueRams = [...new Set(prod.variants.map(v => v.ram))].filter(Boolean);
                    
                    variantsHTML = `
                        <div style="margin-bottom:1.5rem;" id="variant-selector">
                            ${uniqueColors.length > 0 ? `
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Color:</h4>
                                <div style="display:flex; gap:0.5rem;" id="color-opts">
                                    ${uniqueColors.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="color" data-val="${c}" style="padding:0.3rem 0.8rem; border: 1px solid var(--border-color); border-radius:4px; cursor:pointer;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}
                            ${uniqueCaps.length > 0 ? `
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Capacidad:</h4>
                                <div style="display:flex; gap:0.5rem;" id="cap-opts">
                                    ${uniqueCaps.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="capacity" data-val="${c}" style="padding:0.3rem 0.8rem; border: 1px solid var(--border-color); border-radius:4px; cursor:pointer;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}
                            ${uniqueRams.length > 0 ? `
                            <div style="margin-bottom:1rem;">
                                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">RAM:</h4>
                                <div style="display:flex; gap:0.5rem;" id="ram-opts">
                                    ${uniqueRams.map((c,i) => `<button class="var-btn ${i===0?'active':''}" data-type="ram" data-val="${c}" style="padding:0.3rem 0.8rem; border: 1px solid var(--border-color); border-radius:4px; cursor:pointer;">${c}</button>`).join('')}
                                </div>
                            </div>
                            ` : ''}
                            <p id="variant-stock-msg" style="font-size:0.85rem; color:#555555; font-weight:bold;"></p>
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
                    if (i <= Math.floor(avgRating)) starsHtml += '<i class="fa-solid fa-star"></i>';
                    else if (i - avgRating < 1) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
                    else starsHtml += '<i class="fa-regular fa-star"></i>';
                }

                singleProductContainer.innerHTML = `
                    <div style="width: 100%;">
                        <div class="product-details" data-id="${prod.id}" style="display:grid; grid-template-columns:1fr 1fr; gap:4rem; max-width:1000px; margin:0 auto; padding:2rem;">
                            <div class="product-gallery">
                                ${prod.is_offer ? `<div class="badge" style="position:absolute; background:#ff4757; color:white; padding:0.5rem 1rem; font-weight:bold; border-radius:4px;">OFERTA</div>` : ''}
                                <div style="position: relative; overflow: hidden; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                    <img id="main-product-img" src="${image}" alt="${prod.name}" style="width:100%; display:block; transition: transform 0.3s; cursor: zoom-in;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onmousemove="const rect=this.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width;const y=(event.clientY-rect.top)/rect.height;this.style.transformOrigin=(x*100) + '%' + ' ' + (y*100) + '%';">
                                </div>
                                <div class="gallery-thumbnails">
                                    <img src="${image}" class="gallery-thumb active" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');">
                                    <img src="https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Trasera">
                                    <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&q=80" class="gallery-thumb" onclick="document.getElementById('main-product-img').src=this.src; document.querySelectorAll('.gallery-thumb').forEach(e=>e.classList.remove('active')); this.classList.add('active');" title="Vista Lateral">
                                </div>
                            </div>
                            <div class="product-info" style="display:flex; flex-direction:column; justify-content:center;">
                                <p style="color: var(--text-muted); font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:0.5rem;">${prod.brand} | ${prod.category}</p>
                                <h2 style="font-size:2.5rem; margin-bottom:0.5rem; color: var(--text-color);">${prod.name}</h2>
                                <div class="product-rating" style="justify-content: flex-start; margin-bottom: 1rem; font-size: 1.1rem; display: flex; gap: 0.2rem; align-items: center;">
                                    ${starsHtml}
                                    <span style="margin-left: 0.5rem;">(${avgRating}) - ${numReviews} Reseñas</span>
                                </div>
                                ${oldPrice}
                                <p class="price" style="font-size:2rem; font-weight:bold; color: var(--text-color); margin-bottom:1.5rem;">$${window.formatPrice(Number(prod.price))}</p>
                                
                                ${variantsHTML}

                                <!-- Calculador de Envíos -->
                                <div style="background: var(--gray-bg); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                                    <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;"><i class="fa-solid fa-truck"></i> Calcula tu envío</h4>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <input type="text" id="calc-zip" placeholder="Tu Código Postal" style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
                                        <button id="calc-btn" class="btn" style="padding: 0.5rem 1rem;">Calcular</button>
                                    </div>
                                    <p id="zip-msg" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); display: none;"></p>
                                </div>
                                
                                <p style="line-height:1.6; color: var(--text-muted); margin-bottom:2rem;">${prod.description}</p>
                                
                                <div style="display:flex; gap:1rem; align-items:center;">
                                    <button class="btn add-to-cart-btn" style="flex:1; padding:1rem; font-size:1.1rem; ${isOutOfStock ? 'background:#ccc; cursor:not-allowed;' : ''}" ${isOutOfStock ? 'disabled' : ''}>
                                        <i class="fa-solid ${isOutOfStock ? 'fa-box-open' : 'fa-cart-plus'}"></i> ${isOutOfStock ? 'Sin Stock' : 'Añadir al carrito'}
                                    </button>
                                </div>

                                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                                    <ul style="list-style:none; padding:0; margin:0; font-size:0.9rem; color: var(--text-muted);">
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-shield-halved" style="margin-right:10px; color:#555555;"></i> 12 meses de garantía oficial</li>
                                        <li style="margin-bottom:0.5rem;"><i class="fa-solid fa-rotate-left" style="margin-right:10px; color:#555555;"></i> Devolución gratuita en 30 días</li>
                                        <li><i class="fa-solid fa-truck-fast" style="margin-right:10px; color: var(--text-color);"></i> <strong>Envío Inmediato</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN DE RESEÑAS -->
                        <div style="max-width: 1000px; margin: 4rem auto; padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                            <h3 style="font-size: 1.8rem; margin-bottom: 2rem; border-bottom: 2px solid #555555; display: inline-block; padding-bottom: 0.5rem;">Reseñas de Clientes</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 3rem;">
                                <!-- Formulario de Reseña -->
                                <div>
                                    <h4 style="margin-bottom: 1rem;">Deja tu opinión</h4>
                                    <form id="review-form">
                                        <div style="margin-bottom: 1rem;">
                                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Calificación</label>
                                            <select id="review-rating" style="width: 100%; padding: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color);">
                                                <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                                                <option value="4">⭐⭐⭐⭐ Muy Bueno</option>
                                                <option value="3">⭐⭐⭐ Bueno</option>
                                                <option value="2">⭐⭐ Regular</option>
                                                <option value="1">⭐ Malo</option>
                                            </select>
                                        </div>
                                        <div style="margin-bottom: 1rem;">
                                            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">Comentario</label>
                                            <textarea id="review-comment" rows="4" style="width: 100%; padding: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); resize: vertical;" placeholder="Cuéntanos tu experiencia con el producto..."></textarea>
                                        </div>
                                        <button type="submit" class="btn" style="width: 100%;">Publicar Reseña</button>
                                    </form>
                                    <p id="review-msg" style="margin-top: 1rem; font-size: 0.9rem; color: #555555; display: none;"></p>
                                </div>

                                <!-- Lista de Reseñas -->
                                <div style="max-height: 400px; overflow-y: auto; padding-right: 1rem;">
                                    ${reviews.length === 0 ? '<p style="color: var(--text-muted); font-style: italic;">Aún no hay reseñas. ¡Sé el primero en opinar!</p>' : ''}
                                    ${reviews.map(r => `
                                        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                <strong style="color: var(--text-color);">${r.user_name}</strong>
                                                <span style="color: #f1c40f; font-size: 0.9rem;">${'⭐'.repeat(r.rating)}</span>
                                            </div>
                                            <p style="color: var(--text-muted); margin: 0; font-size: 0.95rem; line-height: 1.5;">"${r.comment}"</p>
                                            <small style="color: #aaa; display: block; margin-top: 0.5rem;">${new Date(r.created_at).toLocaleDateString()}</small>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Manejo de envío de reseña
                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                    reviewForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem('phoneSpotToken');
                        if (!token) {
                            alert('Debes iniciar sesión para dejar una reseña.');
                            window.location.href = 'login.html';
                            return;
                        }
                        
                        const rating = document.getElementById('review-rating').value;
                        const comment = document.getElementById('review-comment').value;
                        
                        try {
                            const res = await fetch('http://localhost:3000/api/reviews', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                                body: JSON.stringify({ product_id: prod.id, rating: Number(rating), comment })
                            });
                            
                            if (res.ok) {
                                document.getElementById('review-msg').innerText = '¡Gracias por tu reseña! Recarga la página para verla.';
                                document.getElementById('review-msg').style.display = 'block';
                                reviewForm.reset();
                            } else {
                                const data = await res.json();
                                alert('Error: ' + data.error);
                            }
                        } catch(err) {
                            alert('Error de conexión.');
                        }
                    });
                }

                if (hasVariants) {
                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const type = e.target.getAttribute('data-type');
                            document.querySelectorAll(`[data-type="${type}"]`).forEach(el => el.classList.remove('active'));
                            e.target.classList.add('active');
                            e.target.style.background = '#111';
                            e.target.style.color = '#fff';
                            document.querySelectorAll(`[data-type="${type}"]:not(.active)`).forEach(el => {
                                el.style.background = 'transparent';
                                el.style.color = '#111';
                            });
                            checkVariantStock(prod);
                        });
                    });
                    
                    // Inicializar estilos de botones active
                    document.querySelectorAll('.var-btn.active').forEach(el => {
                        el.style.background = '#111';
                        el.style.color = '#fff';
                    });
                    checkVariantStock(prod);
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
                                zipMsg.innerHTML = `<i class="fa-solid fa-truck"></i> Envío estimado: <strong>$${window.formatPrice(simulatedCost)}</strong>`;
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
        fetch('http://localhost:3000/api/products')
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
                        const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
                        
    // Estrellas aleatorias entre 4 y 5
    const rating = (4 + Math.random()).toFixed(1);
    const starHTML = `
        <div class="stars">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star${rating < 4.5 ? '-half-stroke' : ''}"></i>
            <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 5px;">(${rating})</span>
        </div>
    `;

                    const cardHTML = `
                        <div class="product-card fade-up" data-id="${prod.id}">
                                ${prod.is_offer ? `<div class="badge">OFERTA</div>` : ''}
                                <a href="producto.html?id=${prod.id}"><img src="${image}" alt="${prod.name}"></a>
                                <h4><a href="producto.html?id=${prod.id}" style="color:inherit; text-decoration:none;">${prod.name}</a></h4>
                                <div class="product-rating">
                                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                                    <span>(4.8)</span>
                                </div>
                                <p class="price">$${prod.price}</p>
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
                    labelEfectivo.title = 'Solo disponible para San Josééé, Colón, Villa Elisa y C. del Uruguay';
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
            const shipping_address = document.getElementById('chk-address').value + ', ' + city + ' CP: ' + document.getElementById('chk-zip').value;

            let shipping_cost = 0;
            const settings = window.phoneSpotSettings || { free_shipping_threshold: 1500000 };
            const threshold = settings.free_shipping_threshold;
            
            // Calcular total del carrito para saber si aplica envío gratis
            const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const isFreeShipping = threshold > 0 && cartTotal >= threshold;

            if (city === 'Otra') {
                const selShip = document.querySelector('input[name="shipping_method"]:checked');
                if(selShip) {
                    shipping_cost = selShip.value === 'andreani' 
                        ? (settings.shipping_andreani || 12000) 
                        : (settings.shipping_correo || 8500);
                    
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
                showToast('Procesando orden...', 'fa-spinner fa-spin');

                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items, shipping_address, customer_email, customer_name, payment_method: paymentMethod, shipping_cost: (window.currentCoupon && window.currentCoupon.type === 'shipping') ? 0 : shippingCost, discount_code: window.currentCoupon ? window.currentCoupon.code : null, discount_amount: (window.currentCoupon && window.currentCoupon.type === 'fixed') ? window.currentCoupon.value : ((window.currentCoupon && window.currentCoupon.type === 'percent') ? (total * (window.currentCoupon.value / 100)) : 0), dolar_value: window.dolarValue })
                });

                const data = await response.json();
                
                if (response.ok) {
                    if (paymentMethod === 'efectivo') {
                        // Generar mensaje de WhatsApp
                        
                        let totalQuantity = 0;
                        cart.forEach(item => totalQuantity += item.quantity);
                        const isWholesale = totalQuantity >= 3;
                        const wholesaleDiscount = 5;

                        const orderTotal = cart.reduce((acc, item) => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            return acc + (finalPrice * item.quantity);
                        }, 0);

                        let wpMsg = `Hola PhoneSpot! Acabo de hacer un pedido de pago en efectivo.\n\n*Nombre:* ${customer_name}\n*Dirección:* ${shipping_address}\n*Total a pagar:* ${window.formatPrice(orderTotal)}\n`;
                        if (isWholesale) wpMsg += `*Beneficio:* Precio Mayorista Activado (-$5 USD c/u)\n`;
                        wpMsg += `\n*Productos:*\n`;

                        cart.forEach(item => {
                            let finalPrice = item.price;
                            if (isWholesale) finalPrice -= wholesaleDiscount;
                            wpMsg += `- ${item.quantity}x ${item.name} (${window.formatPrice(finalPrice)})\n`;
                        });
                        wpMsg += `\nQuiero coordinar el pago en efectivo con ustedes (Pesos/Dólares).`;

                        
                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = `https://wa.me/${wpPhone}?text=${encodeURIComponent(wpMsg)}`;
                        cart = [];
                        saveCart();
                        updateCartUI();
                        
                        showToast('¡Orden registrada! Redirigiendo a WhatsApp...', 'fa-check');
                        setTimeout(() => window.location.href = wpUrl, 2000);
                    } else if (paymentMethod === 'mercadopago') {
                        
                        showToast('Redirigiendo a Mercado Pago...', 'fa-spinner fa-spin');
                        // Call MP endpoint
                        try {
                            const mpRes = await fetch('http://localhost:3000/api/mercadopago/preference', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ items: cart, customer_email, total_ars: Math.round(orderTotal * window.dolarValue) })
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
                const res = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, email, password})
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('Cuenta creada. Inicia sesión.', 'fa-check');
                    setTimeout(() => window.location.href = 'login.html', 1500);
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
                const res = await fetch('http://localhost:3000/api/login', {
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
                    <input type="text" class="var-ram" placeholder="RAM (Opc. Ej: 8GB)" style="flex:1; min-width:120px;">
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
                const res = await fetch('http://localhost:3000/api/products', {
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
                    const res = await fetch('http://localhost:3000/api/products');
                    const prods = await res.json();
                    productListContainer.innerHTML = '';
                    if(prods.length === 0) {
                        productListContainer.innerHTML = '<p>No hay productos subidos.</p>';
                        return;
                    }

                    prods.forEach(p => {
                        productListContainer.innerHTML += `
                            <div class="slide-item" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                                <div style="flex:2;">
                                    <h5 style="margin:0;">${p.name} <span style="color:#555555;">($${p.price})</span></h5>
                                    <p style="margin:0; font-size:0.8rem; color: var(--text-muted);">Cat: ${p.category} | Marca: ${p.brand}</p>
                                </div>
                                <div style="flex:1; display:flex; gap:0.5rem; align-items:center;">
                                    <label style="font-size:0.8rem;">Stock:</label>
                                    <input type="number" id="stock-${p.id}" value="${p.stock}" style="width:70px; padding:0.2rem;">
                                    <button onclick="updateStock(${p.id})" class="btn" style="padding:0.3rem 0.5rem; font-size:0.8rem; background:#333;">Actualizar</button>
                                </div>
                                <div>
                                    <button onclick="deleteProduct(${p.id})" class="btn-danger" style="padding:0.4rem 0.6rem;"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                    });
                } catch(e) { productListContainer.innerHTML = 'Error cargando productos'; }
            };

            window.updateStock = async (id) => {
                const stock = document.getElementById(`stock-${id}`).value;
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const res = await fetch(`http://localhost:3000/api/products/${id}/stock`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ stock })
                    });
                    if(res.ok) showToast('Stock actualizado', 'fa-check');
                    else showToast('Error actualizando stock', 'fa-triangle-exclamation');
                } catch(e) {}
            };

            window.deleteProduct = async (id) => {
                if(!confirm('¿Estás seguro de eliminar está producto definitivamente?')) return;
                const token = localStorage.getItem('phoneSpotToken');
                try {
                    const res = await fetch(`http://localhost:3000/api/products/${id}`, {
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
                  const res = await fetch('http://localhost:3000/api/orders/'+id+'/status', {
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
                  const res = await fetch('http://localhost:3000/api/orders', {
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
                        const res = await fetch('http://localhost:3000/api/products');
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
                    const res = await fetch('http://localhost:3000/api/settings');
                    const data = await res.json();
                    currentSettings = { ...currentSettings, ...data };
                    
                    if(document.getElementById('set-banner')) {
                        document.getElementById('set-banner').value = currentSettings.top_banner || '';
                    }
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
                    const res = await fetch('http://localhost:3000/api/settings', {
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
                    currentSettings.top_banner = document.getElementById('set-banner').value;
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
                carouselForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if(!currentSettings.carousel) currentSettings.carousel = [];
                    currentSettings.carousel.push({
                        title: document.getElementById('set-car-title').value,
                        subtitle: document.getElementById('set-car-subtitle').value,
                        link: document.getElementById('set-car-link').value,
                        image: document.getElementById('set-car-img').value
                    });
                    carouselForm.reset();
                    renderAdminCarouselList();
                    saveSettings();
                });
            }

            loadAdminSettings();
        }
    }
});

// Función para cargar ajustes en el frontend (index.html)
async function applyFrontendSettings() {
    try {
        const res = await fetch('http://localhost:3000/api/settings');
        const data = await res.json();
        
        // Guardar costos globalmente para uso en checkout
        window.phoneSpotSettings = data;

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

        // Marquee
        const marqueeSpan = document.querySelector('.top-banner .scrolling-text span');
        if (marqueeSpan && data.top_banner) {
            marqueeSpan.innerText = data.top_banner;
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
        const res = await fetch('http://localhost:3000/api/products');
        const allProds = await res.json();
        const favProds = allProds.filter(p => favs.includes(p.id.toString()));

        if (favProds.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); grid-column:1/-1;">Los productos guardados ya no están disponibles.</p>';
            return;
        }

        container.innerHTML = '';
        favProds.forEach(prod => {
            const image = prod.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
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
                        <button onclick="
                            const cart = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotCart') || '[]'); } catch(e) { return []; } })();
                            const existing = cart.find(i => i.id == '${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '${prod.id}', name: '${prod.name}', price: ${prod.price}, image: '${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " class="btn" style="background: #333333; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#333333'">
                            <i class="fa-solid fa-cart-plus" style="margin-right: 5px;"></i> Añadir
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
                        <p style="margin: 0 0 0.5rem 0; font-weight: 900; color: var(--text-color); font-size: 1.1rem;">$${window.formatPrice(Number(prod.price))}</p>
                        
                        <button onclick="
                            const cart = (function(){ try { return JSON.parse(localStorage.getItem('phoneSpotCart') || '[]'); } catch(e) { return []; } })();
                            const existing = cart.find(i => i.id == '${prod.id}');
                            if(existing) existing.quantity++;
                            else cart.push({id: '${prod.id}', name: '${prod.name}', price: ${prod.price}, image: '${image}', quantity: 1});
                            localStorage.setItem('phoneSpotCart', JSON.stringify(cart));
                            if(window.updateCartCount) window.updateCartCount();
                            showToast('Añadido al carrito', 'fa-cart-plus');
                        " style="background: #333333; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; width: 100%; font-size: 0.9rem;" onmouseover="this.style.background='#111'" onmouseout="this.style.background='#333333'">
                            <i class="fa-solid fa-cart-plus"></i> Añadir al carrito
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
