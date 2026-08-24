const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

const mobileCSSFixes = `
/* --- ULTIMATE MOBILE RESPONSIVE CATALOG FIX --- */
@media (max-width: 768px) {
    #full-catalog-container, #products-grid {
        grid-template-columns: repeat(2, 1fr) !important; /* Strictly 2 columns */
        gap: 0.8rem !important;
        width: 100% !important;
        padding: 0 !important;
        box-sizing: border-box !important;
    }
    
    .product-card {
        padding: 0.8rem 0.5rem !important;
        border-radius: 12px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important; /* Prevents overflow */
        margin: 0 !important;
    }
    
    .product-img-wrapper {
        height: 120px !important;
        margin-bottom: 0.5rem !important;
    }
    
    .product-card h4 {
        font-size: 0.9rem !important;
        margin-bottom: 0.5rem !important;
        line-height: 1.2 !important;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .product-card .price, .product-card p[style*="font-size: 1.4rem"] {
        font-size: 1.1rem !important;
    }
    
    .product-card .add-to-cart-btn {
        padding: 0.5rem !important;
        font-size: 0.75rem !important;
        white-space: normal !important;
        line-height: 1.1 !important;
        width: 100% !important;
    }
    
    .catalog-container {
        padding: 1rem !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow-x: hidden !important;
    }
    
    body {
        overflow-x: hidden !important;
    }
}
`;

if (!css.includes('ULTIMATE MOBILE RESPONSIVE CATALOG FIX')) {
    css += mobileCSSFixes;
    fs.writeFileSync('public/style.css', css, 'utf8');
    console.log('Mobile catalog CSS fixes injected into style.css');
}
