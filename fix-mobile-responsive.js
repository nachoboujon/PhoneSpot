const fs = require('fs');

let css = fs.readFileSync('public/style.css', 'utf8');

const massiveMobileFixes = `
/* ========================================= */
/* MASSIVE RESPONSIVE OVERHAUL (MOBILE & TABLET) */
/* ========================================= */

@media (max-width: 900px) {
    /* Auth Layout */
    .auth-banner { display: none !important; }
    .auth-layout { flex-direction: column; }
    .auth-form-wrapper { padding: 1.5rem !important; }
}

@media (max-width: 768px) {
    /* Global Adjustments */
    body { font-size: 14px; }
    
    /* Hero Banner Home */
    .hero {
        padding: 4rem 1rem !important;
    }
    .hero-content {
        padding: 2rem 1.5rem !important;
        margin: 0 1rem !important;
        width: 100% !important;
    }
    .hero-content h2 {
        font-size: 2rem !important;
    }
    .floating-phone { display: none !important; } /* Hide 3D floating phone on very small screens to avoid overflow */

    /* Product Grid */
    #products-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
        gap: 1rem !important;
    }
    .product-card {
        padding: 1rem !important;
    }
    .product-card h3 {
        font-size: 0.95rem !important;
        height: auto !important;
        margin-bottom: 0.5rem !important;
    }
    .product-card .price {
        font-size: 1.1rem !important;
    }
    .product-card img {
        height: 120px !important;
        margin-bottom: 0.5rem !important;
    }
    .product-card button {
        padding: 0.5rem !important;
        font-size: 0.8rem !important;
    }

    /* Catalog Page Layout */
    .catalog-container {
        flex-direction: column !important;
        gap: 1rem !important;
        padding: 1.5rem 5% !important;
    }
    #filters-sidebar {
        flex: none !important;
        width: 100% !important;
        position: static !important;
        margin-bottom: 1rem !important;
    }

    /* Footer */
    footer {
        padding: 2rem 5% !important;
    }
    footer > div {
        flex-direction: column !important;
        gap: 2rem !important;
        text-align: center !important;
    }
    footer > div > div {
        align-items: center !important;
    }
    
    /* Checkout & Cart */
    .checkout-page {
        flex-direction: column !important;
        padding: 1rem !important;
    }
    .checkout-form, .checkout-summary {
        width: 100% !important;
        padding: 1.5rem !important;
    }
    
    /* Toast Notifications */
    .toast {
        width: 90% !important;
        left: 5% !important;
        font-size: 0.9rem !important;
        padding: 10px 15px !important;
    }
}

@media (max-width: 480px) {
    /* Very Small Phones (iPhone SE, etc) */
    header .logo h1 { font-size: 1.3rem !important; }
    .hero-content h2 { font-size: 1.6rem !important; }
    #products-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
        gap: 0.8rem !important;
    }
}
`;

if (!css.includes('MASSIVE RESPONSIVE OVERHAUL')) {
    css += '\n' + massiveMobileFixes;
    fs.writeFileSync('public/style.css', css, 'utf8');
    console.log('style.css successfully updated with massive mobile responsive fixes');
}

// Ensure catalogo.html wrapper div has a class for the media query to target
let catalogo = fs.readFileSync('public/catalogo.html', 'utf8');
catalogo = catalogo.replace(/<div style="padding: 3rem 5%; max-width: 1400px; margin: 0 auto; display: flex; gap: 3rem; align-items: flex-start; flex-wrap: wrap;">/, '<div class="catalog-container" style="padding: 3rem 5%; max-width: 1400px; margin: 0 auto; display: flex; gap: 3rem; align-items: flex-start; flex-wrap: wrap;">');
fs.writeFileSync('public/catalogo.html', catalogo, 'utf8');
console.log('catalogo.html wrapper class added');

// Ensure checkout wrapper has a class
let checkout = fs.readFileSync('public/checkout.html', 'utf8');
checkout = checkout.replace(/<main class="checkout-page" style="padding: 3rem 5%; max-width: 1400px; margin: 0 auto; display:flex; gap: 2rem; align-items:flex-start; flex-wrap: wrap;">/, '<main class="checkout-page" style="padding: 3rem 5%; max-width: 1400px; margin: 0 auto; display:flex; gap: 2rem; align-items:flex-start;">');
fs.writeFileSync('public/checkout.html', checkout, 'utf8');
console.log('checkout.html inline styles adjusted');

