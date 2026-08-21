const fs = require('fs');

// 1. FIX CATALOGO.HTML HAMBURGER ID
let catHTML = fs.readFileSync('public/catalogo.html', 'utf8');
catHTML = catHTML.replace('<div class="menu-toggle"><i class="fa-solid fa-bars"></i></div>', '<div class="menu-toggle" id="mobile-menu-btn"><i class="fa-solid fa-bars"></i></div>');
fs.writeFileSync('public/catalogo.html', catHTML, 'utf8');
console.log('Fixed hamburger ID in catalogo.html');

// 2. FIX SCRIPT.JS INLINE STYLES FOR PRODUCT GRID
let script = fs.readFileSync('public/script.js', 'utf8');
const regexInline = /style="display:grid; grid-template-columns:1fr 1\.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2\.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba\(0,0,0,0\.06\);"/;
script = script.replace(regexInline, 'class="product-details-grid"');
fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed inline styles in script.js');

// 3. FIX STYLE.CSS FOR HEADER AND PRODUCT GRID
const cssPatch = `

/* ========================================= */
/* FIX RESPONSIVE DESIGN (HEADER Y PRODUCTOS) */
/* ========================================= */
.product-details-grid {
    display: grid; 
    grid-template-columns: 1fr 1.1fr; 
    gap: 3rem; 
    max-width: 1100px; 
    margin: 0 auto; 
    padding: 2.5rem; 
    background: #fff; 
    border-radius: 20px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.06);
}

@media (max-width: 768px) {
    /* Header Responsive Layout */
    header {
        flex-wrap: wrap !important;
        padding: 1rem 5% !important;
    }
    header .logo {
        order: 1 !important;
        flex: 1 !important;
        text-align: center;
    }
    header .logo h1 {
        font-size: 1.5rem !important;
        justify-content: center;
    }
    header .logo img {
        height: 28px !important;
    }
    header .menu-toggle {
        order: 0 !important;
        margin-right: 0 !important;
        font-size: 1.5rem;
    }
    header .header-icons {
        order: 2 !important;
    }
    header .search-bar {
        order: 3 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin-right: 0 !important;
        margin-top: 1rem !important;
    }
    nav { 
        top: 130px !important; 
        height: calc(100vh - 130px) !important; 
    }
    
    /* Product Page Grid */
    .product-details-grid {
        grid-template-columns: 1fr !important;
        padding: 1.5rem !important;
        gap: 1.5rem !important;
    }
}
`;
fs.appendFileSync('public/style.css', cssPatch, 'utf8');
console.log('Appended CSS fixes to style.css');
