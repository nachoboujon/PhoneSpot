// Estado del carrito en LocalStorage
let cart = JSON.parse(localStorage.getItem('phoneSpotCart')) || [];

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
    const existingItem = cart.find(item => item.id === product.id);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    saveCart();
    
    // Redirigir al carrito
    window.location.href = 'carrito.html';
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart(); // Solo útil si estamos en carrito.html
}

function changeQuantity(id, newQuantity) {
    if (newQuantity < 1) return;
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        renderCart();
    }
}

// Renderizado dinámico del carrito (carrito.html)
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#666;">Tu carrito está vacío.</p>';
        cartTotalElement.innerText = '$0';
        return;
    }

    cart.forEach(item => {
        total += item.price * item.quantity;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="item-quantity">
                    <span>Cantidad:</span>
                    <input type="number" value="${item.quantity}" min="1" onchange="changeQuantity('${item.id}', parseInt(this.value))">
                </div>
            </div>
            <div class="item-price">$${item.price * item.quantity}</div>
            <button onclick="removeFromCart('${item.id}')" style="background:none; color:#999; padding:0; width:auto; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    cartTotalElement.innerText = `$${total}`;
}

// Renderizado para Checkout
function renderCheckout() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutTotal) return;

    let total = 0;
    checkoutItems.innerHTML = '';
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        checkoutItems.innerHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #555;">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${item.price * item.quantity}</span>
            </div>
        `;
    });

    checkoutTotal.innerText = `$${total}`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Lógica para botones "Añadir al carrito" en index y producto
    const addButtons = document.querySelectorAll('.add-to-cart-btn');
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = e.target.closest('.product-card') || e.target.closest('.product-details');
            const id = card.dataset.id;
            const name = card.querySelector('h4, h2').innerText;
            // Limpiar el texto de precio (ej: "$960" -> 960)
            const priceText = card.querySelector('.price').innerText.split('$').pop().trim();
            const price = parseFloat(priceText);
            const img = card.querySelector('img').src;

            addToCart({id, name, price, img});
        });
    });

    // Renderizar carrito si estamos en la página del carrito
    renderCart();
    
    // Renderizar checkout si estamos en checkout
    renderCheckout();

    // Simular envío de formulario de checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (cart.length === 0) {
                alert('No hay productos en el carrito.');
                return;
            }
            alert('¡Pago procesado con éxito! Tu pedido está en camino a nuestra base de datos simulada.');
            cart = [];
            saveCart();
            window.location.href = 'index.html';
        });
    }

    // Lógica del Carrusel (Solo en index)
    const slides = document.querySelectorAll('.carousel-slide');
    if(slides.length > 0) {
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const dots = document.querySelectorAll('.dot');
        let currentSlide = 0;
        let slideInterval;

        const initCarousel = () => {
            slides.forEach((slide, index) => {
                slide.style.transform = `translateX(${100 * (index - currentSlide)}%)`;
                slide.classList.remove('active');
                if(dots[index]) dots[index].classList.remove('active');
            });
            slides[currentSlide].classList.add('active');
            if(dots[currentSlide]) dots[currentSlide].classList.add('active');
        };

        const nextSlide = () => {
            currentSlide = (currentSlide === slides.length - 1) ? 0 : currentSlide + 1;
            initCarousel();
        };

        const prevSlide = () => {
            currentSlide = (currentSlide === 0) ? slides.length - 1 : currentSlide - 1;
            initCarousel();
        };

        const startAutoPlay = () => { slideInterval = setInterval(nextSlide, 5000); };
        const resetAutoPlay = () => { clearInterval(slideInterval); startAutoPlay(); };

        nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
        prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { currentSlide = index; initCarousel(); resetAutoPlay(); });
        });

        initCarousel();
        startAutoPlay();
    }
});
