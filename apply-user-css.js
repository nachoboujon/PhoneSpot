const fs = require('fs');

// 1. Fix style.css for both Catalog and Footer
let css = fs.readFileSync('public/style.css', 'utf8');

const userRequestedFixes = `
/* --- USER REQUESTED MOBILE FIXES (FOOTER & CATALOG 3-COL) --- */
@media (max-width: 768px) {
    /* FOOTER STACKING */
    footer .footer-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
    }
    
    footer .footer-content > div {
        width: 100% !important;
        text-align: left !important;
    }

    /* CATALOG 3 PER ROW */
    #full-catalog-container, #products-grid, .product-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important; /* EXACTLY 3 PER ROW */
        gap: 0.5rem !important;
        width: 100% !important;
    }
    
    /* Shrink product cards to fit 3 per row */
    .product-card {
        padding: 0.5rem !important;
        border-radius: 8px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
    }
    
    .product-img-wrapper {
        height: 80px !important;
        margin-bottom: 0.5rem !important;
    }
    
    .product-card h4 {
        font-size: 0.75rem !important;
        margin-bottom: 0.2rem !important;
        line-height: 1.1 !important;
    }
    
    .product-card p, .product-card .price, .product-card p[style*="font-size: 1.4rem"] {
        font-size: 0.85rem !important;
        margin-bottom: 0.2rem !important;
    }
    
    .product-card .add-to-cart-btn {
        padding: 0.3rem !important;
        font-size: 0.65rem !important;
        border-radius: 6px !important;
    }
}
`;

if (!css.includes('USER REQUESTED MOBILE FIXES')) {
    css += userRequestedFixes;
    fs.writeFileSync('public/style.css', css, 'utf8');
}

// 2. Remove conflicting inline media query from catalogo.html
let html = fs.readFileSync('public/catalogo.html', 'utf8');
html = html.replace(/@media \(max-width: 1024px\) \{[\s\S]*?#full-catalog-container \{[\s\S]*?\}[\s\S]*?\}/, '');
fs.writeFileSync('public/catalogo.html', html, 'utf8');

console.log('Fixed footer and forced 3-column grid on mobile');
