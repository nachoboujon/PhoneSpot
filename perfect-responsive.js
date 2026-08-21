const fs = require('fs');

// 1. Fix script.js inline heights
let script = fs.readFileSync('public/script.js', 'utf8');
script = script.replace(/style="display:block; height: 180px; margin-bottom: 1rem;"/g, 'class="product-img-wrapper"');
script = script.replace(/style="width: 100%; height: 100%; object-fit: contain; transition: transform 0\.3s;"/g, 'class="product-img"');
fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js inline styles removed');

// 2. Rewrite CSS cleanly
let css = fs.readFileSync('public/style.css', 'utf8');
css = css.replace(/\/\* ========================================= \*\/[\s\S]*?\/\* MASSIVE RESPONSIVE OVERHAUL[\s\S]*?(?=\/\*|$)/g, '');

const perfectResponsiveCSS = `
/* ========================================= */
/* 📱 SMART RESPONSIVE OVERHAUL (TABLET & MOBILE) */
/* ========================================= */

/* Product Card Base Defaults */
.product-img-wrapper {
    display: block;
    height: 180px;
    margin-bottom: 1rem;
}
.product-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s;
}

/* 💻 LARGE TABLETS & SMALL LAPTOPS (Max 1024px) */
@media (max-width: 1024px) {
    .catalog-container {
        flex-direction: column !important;
        padding: 2rem 5% !important;
        gap: 1.5rem !important;
    }
    #filters-sidebar {
        flex: none !important;
        width: 100% !important;
        position: relative !important;
        top: 0 !important;
    }
    #products-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
    }
    
    .product-details-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .auth-banner { display: none !important; }
    .auth-layout { flex-direction: column !important; }
}

/* 📱 TABLETS & LARGE PHONES (Max 768px) */
@media (max-width: 768px) {
    body { font-size: 15px; }

    /* Header tweaks */
    header {
        flex-wrap: wrap !important;
        padding: 1rem 5% !important;
    }
    header .logo { order: 1; flex: 1; text-align: center; }
    header .menu-toggle { order: 0; }
    header .header-icons { order: 2; }
    header .search-bar { order: 3; width: 100%; margin-top: 1rem; }

    /* Hero Banner */
    .hero { padding: 3rem 1rem !important; }
    .hero-content {
        padding: 1.5rem !important;
        width: 100% !important;
        margin: 0 !important;
    }
    .hero-content h2 { font-size: 2rem !important; }
    .floating-phone { display: none !important; }

    /* Product Grid */
    #products-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
        gap: 1rem !important;
    }

    /* Refined Product Cards for Mobile */
    .product-card {
        padding: 1rem 0.8rem !important;
    }
    .product-img-wrapper {
        height: 130px !important; /* Smaller height on mobile */
        margin-bottom: 0.5rem !important;
    }
    .product-card h3 {
        font-size: 0.9rem !important;
        line-height: 1.2 !important;
        height: auto !important;
        min-height: 2.4rem !important;
        margin-bottom: 0.5rem !important;
    }
    .product-card .price {
        font-size: 1.1rem !important;
        margin-bottom: 0.5rem !important;
    }
    .product-card button.btn {
        padding: 0.6rem !important;
        font-size: 0.85rem !important;
        width: 100% !important;
    }

    /* Auth & General Padding */
    .auth-form-wrapper { padding: 1.5rem !important; }
    footer { padding: 2rem 5% !important; }
    footer > div {
        flex-direction: column !important;
        text-align: center !important;
        gap: 2rem !important;
    }
    footer > div > div { align-items: center !important; }
    
    .checkout-page { flex-direction: column !important; }
    .checkout-form, .checkout-summary { width: 100% !important; padding: 1.5rem !important; }
}

/* 📱 SMALL PHONES (Max 480px) */
@media (max-width: 480px) {
    #products-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
        gap: 0.5rem !important;
    }
    .product-card { padding: 0.8rem 0.5rem !important; border-radius: 8px !important; }
    .product-img-wrapper { height: 110px !important; }
    .product-card h3 { font-size: 0.85rem !important; }
    .product-card .price { font-size: 1rem !important; }
    .hero-content h2 { font-size: 1.6rem !important; }
}
`;

if (!css.includes('SMART RESPONSIVE OVERHAUL')) {
    css += '\n' + perfectResponsiveCSS;
    fs.writeFileSync('public/style.css', css, 'utf8');
    console.log('style.css responsive rebuilt');
}
