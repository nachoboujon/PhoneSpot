const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. WhatsApp floating button & Fade-in Observer
const domInitCode = `
    // FADE-IN OBSERVER
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

    // FLOATING WHATSAPP BUTTON
    const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
    const waBtn = document.createElement('a');
    waBtn.href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
    waBtn.target = '_blank';
    waBtn.className = 'float-wa fade-up visible';
    waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
    document.body.appendChild(waBtn);
`;
s = s.replace("document.addEventListener('DOMContentLoaded', loadMyOrders);", domInitCode + "\n    document.addEventListener('DOMContentLoaded', loadMyOrders);");

// 2. Skeletons before fetch in loadProductsFromDB
const skeletonHtml = `
    const drawSkeletons = (container, count) => {
        if (!container) return;
        container.innerHTML = Array(count).fill(\`
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-title" style="width: 50%;"></div>
                <div class="skeleton-price"></div>
                <div class="skeleton-btn"></div>
            </div>
        \`).join('');
    };
    if (catalogContainer) drawSkeletons(catalogContainer, 8);
    if (offersContainer) drawSkeletons(offersContainer, 4);
`;
s = s.replace("await window.dolarPromise;", skeletonHtml + "\n        await window.dolarPromise;");

// 3. Stars and fade-up class in product cards
// We replace the HTML generation in renderProducts
const generateStars = `
    // Estrellas aleatorias entre 4 y 5
    const rating = (4 + Math.random()).toFixed(1);
    const starHTML = \`
        <div class="stars">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star\${rating < 4.5 ? '-half-stroke' : ''}"></i>
            <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 5px;">(\${rating})</span>
        </div>
    \`;
`;

// Find the function renderProducts inside loadProductsFromDB
s = s.replace(
    /const cardHTML = `\s*<div class="product-card" data-id="\$\{prod\.id\}">/,
    generateStars + '\n                    const cardHTML = `\n                        <div class="product-card fade-up" data-id="${prod.id}">'
);
// Insert starHTML into the product card
s = s.replace(
    /<h3>\$\{prod\.name\}<\/h3>/,
    "<h3>${prod.name}</h3>\n                                ${starHTML}"
);

// 4. In renderProducts (where it sets innerHTML = cards.join('')), we need to call initFadeObserver
s = s.replace(
    /container\.innerHTML = html;/,
    "container.innerHTML = html;\n            if (window.initFadeObserver) window.initFadeObserver();"
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Added logic for skeletons, stars, WA btn, and fade-in to script.js');
