const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badCode = `    const drawSkeletons = (container, count) => {
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

        await window.dolarPromise;`;

s = s.replace(badCode, "        await window.dolarPromise;");

const correctCode = `    const drawSkeletons = (container, count) => {
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
    
    try {
        await window.dolarPromise;`;

s = s.replace(/try\s*\{\s*await window\.dolarPromise;/, correctCode);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed renderSideCart crash');
