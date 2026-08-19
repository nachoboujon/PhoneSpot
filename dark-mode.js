const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

const darkModeCss = `
/* =================== DARK MODE =================== */
:root {
    --bg-color: #ffffff;
    --text-color: #111111;
    --card-bg: #ffffff;
    --border-color: #eeeeee;
    --header-bg: #ffffff;
    --gray-bg: #f9f9f9;
}

body.dark-mode {
    --bg-color: #121212;
    --text-color: #f1f1f1;
    --card-bg: #1e1e1e;
    --border-color: #333333;
    --header-bg: #1e1e1e;
    --gray-bg: #1a1a1a;
}

body {
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 0.3s, color 0.3s;
}

header { background-color: var(--header-bg) !important; border-bottom: 1px solid var(--border-color); }
header a { color: var(--text-color) !important; }
.product-card { background-color: var(--card-bg) !important; border-color: var(--border-color) !important; color: var(--text-color); }
.product-card h4 a { color: var(--text-color) !important; }
.product-card p { color: var(--text-color) !important; }
.cart-sidebar { background-color: var(--bg-color) !important; color: var(--text-color) !important; border-left: 1px solid var(--border-color); }
.cart-sidebar h2 { border-bottom: 1px solid var(--border-color); }
.cart-item { border-bottom: 1px solid var(--border-color) !important; }
.search-results { background-color: var(--card-bg) !important; border: 1px solid var(--border-color); }
input, select, textarea { background-color: var(--bg-color) !important; color: var(--text-color) !important; border: 1px solid var(--border-color) !important; }

/* Fixes for specific elements in dark mode */
.dark-mode .brands-section, .dark-mode .features { background-color: var(--gray-bg) !important; }
.dark-mode .brand-card { background-color: var(--card-bg) !important; border-color: var(--border-color) !important; }
.dark-mode footer { background-color: #0a0a0a !important; border-top: 1px solid #222; }
.dark-mode #filters-sidebar, .dark-mode .product-details { background-color: var(--card-bg) !important; border-color: var(--border-color) !important; }
.dark-mode .checkout-container { background-color: var(--card-bg) !important; border-color: var(--border-color) !important; }
.dark-mode .search-bar input { color: var(--text-color); }
.dark-mode .fa-moon { display: none; }
.dark-mode .fa-sun { display: inline-block; }
body:not(.dark-mode) .fa-sun { display: none; }
body:not(.dark-mode) .fa-moon { display: inline-block; }

/* Favorites Icon */
.fav-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    color: #ccc;
    transition: 0.3s;
    z-index: 5;
}
.fav-btn:hover { transform: scale(1.1); color: #ff4757; }
.fav-btn.active { color: #ff4757; }
.dark-mode .fav-btn { background: rgba(0, 0, 0, 0.5); }

/* Gallery Thumbnails */
.gallery-thumbnails {
    display: flex;
    gap: 10px;
    margin-top: 1rem;
    overflow-x: auto;
    padding-bottom: 5px;
}
.gallery-thumb {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid transparent;
    opacity: 0.6;
    transition: 0.3s;
}
.gallery-thumb:hover, .gallery-thumb.active {
    opacity: 1;
    border-color: #2e8b57;
}
`;

fs.writeFileSync('public/style.css', css + '\n' + darkModeCss, 'utf8');
