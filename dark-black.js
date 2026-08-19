const fs = require('fs');
let s = fs.readFileSync('public/style.css', 'utf8');

const regex = /body\.dark-mode\s*\{[^}]+\}/;
const newDarkMode = `body.dark-mode {
    --bg-color: #000000;
    --text-color: #ffffff;
    --card-bg: #050505;
    --border-color: #1a1a1a;
    --header-bg: rgba(0, 0, 0, 0.9);
    --gray-bg: #020202;
}`;

s = s.replace(regex, newDarkMode);

const bodyRegex = /body\s*\{[^}]*transition:[^}]+\}/;
const newBody = `body {
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 1s cubic-bezier(0.25, 1, 0.5, 1), color 0.5s ease;
}`;
s = s.replace(bodyRegex, newBody);

s += `

/* Global Transition for smooth Dark Mode */
header, .product-card, .search-results, .cart-sidebar, input, select, textarea, .brands-section, .features, footer, #filters-sidebar, .product-details, .checkout-container {
    transition: background-color 1s cubic-bezier(0.25, 1, 0.5, 1), border-color 1s ease, box-shadow 1s ease, color 0.5s ease !important;
}

/* Theme toggle aesthetic animation */
#theme-toggle {
    position: relative;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

#theme-toggle i {
    position: absolute;
    transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.5s ease, color 0.5s ease;
}

body:not(.dark-mode) #theme-toggle .fa-moon {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
    color: #111;
}

body:not(.dark-mode) #theme-toggle .fa-sun {
    transform: translateY(30px) rotate(180deg);
    opacity: 0;
}

body.dark-mode #theme-toggle .fa-moon {
    transform: translateY(-30px) rotate(-180deg);
    opacity: 0;
}

body.dark-mode #theme-toggle .fa-sun {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
    color: #f1c40f;
    text-shadow: 0 0 15px rgba(241, 196, 15, 1);
}

/* Fix product cards in pure black */
body.dark-mode .product-card {
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.03) !important;
}
body.dark-mode .product-card:hover {
    box-shadow: 0 8px 30px rgba(46, 139, 87, 0.2) !important;
    border-color: rgba(46, 139, 87, 0.5) !important;
}
`;

fs.writeFileSync('public/style.css', s, 'utf8');
