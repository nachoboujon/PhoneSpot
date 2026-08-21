const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const observerLogic = `
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
document.addEventListener('DOMContentLoaded', () => {
    if (window.initFadeObserver) window.initFadeObserver();
});
`;

if (!s.includes('window.initFadeObserver')) {
    s += '\n' + observerLogic;
}

// Ensure initFadeObserver is called inside loadProductsFromDB right after the forEach loop!
const oldLoopEnd = `            } else if (catalogContainer) {
                catalogContainer.innerHTML += cardHTML;
                catalogCount++;
            }
        });`;

const newLoopEnd = `            } else if (catalogContainer) {
                catalogContainer.innerHTML += cardHTML;
                catalogCount++;
            }
        });
        if (window.initFadeObserver) window.initFadeObserver();`;

if (!s.includes('if (window.initFadeObserver) window.initFadeObserver();')) {
    s = s.replace(oldLoopEnd, newLoopEnd);
} else {
    // If it was already injected, replace the whole loop end to be safe
    s = s.replace(oldLoopEnd, newLoopEnd);
}

// And also replace in renderProducts (used for filtering)
const oldRenderEnd = `container.innerHTML = html;`;
const newRenderEnd = `container.innerHTML = html;
        if (window.initFadeObserver) window.initFadeObserver();`;
if (!s.includes(newRenderEnd)) {
    s = s.replace(oldRenderEnd, newRenderEnd);
}

// Same for the floating whatsapp button! I tried injecting it before but it might have failed.
if (!s.includes('class="float-wa')) {
    const waPhone = `
    const waPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
    const waBtn = document.createElement('a');
    waBtn.href = \`https://wa.me/\${waPhone}?text=\${encodeURIComponent('¡Hola PhoneSpot! Vengo de su página web y me gustaría hacer una consulta.')}\`;
    waBtn.target = '_blank';
    waBtn.className = 'float-wa fade-up visible';
    waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
    document.body.appendChild(waBtn);
    `;
    s += '\n' + waPhone;
}

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed invisible fade-up products and WA button');
