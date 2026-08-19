const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const oldBrands = `<section id="marcas" class="brands-section">
            <h3>Nuestras Marcas</h3>
            <div class="brands-grid">
                <div class="brand-card">Apple</div>
                <div class="brand-card">Samsung</div>
                <div class="brand-card">Xiaomi</div>
                <div class="brand-card">Motorola</div>
            </div>
        </section>`;

const newBrands = `<!-- Brands Logo Carousel -->
        <section id="marcas" class="brands-section" style="padding: 4rem 0; background: var(--gray-bg); overflow: hidden; border-bottom: 1px solid var(--border-color); border-top: 1px solid var(--border-color);">
            <h3 style="text-align: center; margin-bottom: 3rem; font-size: 2rem; color: var(--text-color);">Nuestras Marcas</h3>
            
            <div class="logo-slider">
                <div class="logo-track">
                    <!-- Original set -->
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="Samsung"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg" alt="Xiaomi"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Motorola_Logo_Black.svg" alt="Motorola"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google"></div>
                    
                    <!-- Duplicated set for infinite loop -->
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" alt="Samsung"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg" alt="Xiaomi"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Motorola_Logo_Black.svg" alt="Motorola"></div>
                    <div class="logo-slide"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google"></div>
                </div>
            </div>
        </section>`;

html = html.replace(oldBrands, newBrands);
fs.writeFileSync('public/index.html', html, 'utf8');

// Append CSS
let css = fs.readFileSync('public/style.css', 'utf8');
const brandCss = `
/* --- BRAND LOGO CAROUSEL --- */
.logo-slider {
    width: 100%;
    margin: auto;
    position: relative;
    display: flex;
    align-items: center;
    overflow: hidden;
}

.logo-slider::before,
.logo-slider::after {
    content: "";
    position: absolute;
    top: 0;
    width: 150px;
    height: 100%;
    z-index: 2;
}

.logo-slider::before {
    left: 0;
    background: linear-gradient(to right, var(--gray-bg) 0%, transparent 100%);
}

.logo-slider::after {
    right: 0;
    background: linear-gradient(to left, var(--gray-bg) 0%, transparent 100%);
}

.logo-track {
    display: flex;
    width: calc(250px * 10);
    animation: scrollLogos 20s linear infinite;
}

.logo-track:hover {
    animation-play-state: paused;
}

.logo-slide {
    width: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 2rem;
}

.logo-slide img {
    max-width: 120px;
    max-height: 50px;
    filter: grayscale(100%) opacity(0.6);
    transition: filter 0.3s ease, transform 0.3s ease;
}

.logo-slide img:hover {
    filter: grayscale(0%) opacity(1);
    transform: scale(1.1);
}

/* Light mode adjustment for dark SVG logos */
body:not(.dark-mode) .logo-slide img {
    /* If the logo is black, it looks fine on light mode */
}

@keyframes scrollLogos {
    0% { transform: translateX(0); }
    100% { transform: translateX(calc(-250px * 5)); }
}
`;

if (!css.includes('BRAND LOGO CAROUSEL')) {
    fs.writeFileSync('public/style.css', css + '\n' + brandCss, 'utf8');
}
