const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const oldCarouselCheck = /if \(!data\.carousel \|\| data\.carousel\.length === 0\) \{[\s\S]*?\} else \{/;
const newCarouselCheck = `if (!data.carousel || data.carousel.length === 0) {
                // FALLBACK: Mostrar un banner por defecto
                heroCarouselSection.style.display = 'block';
                if (carouselContainer) {
                    carouselContainer.innerHTML = \`
                        <div class="carousel-slide active" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat; display: flex; align-items: center; justify-content: center; height: 100vh; position: absolute; top:0; left:0; right:0; bottom:0;">
                            <div class="slide-content text-center" style="color:white; z-index:2;">
                                <h1>Bienvenido a PhoneSpot</h1>
                                <p>Configura tus banners en el panel de administrador</p>
                            </div>
                        </div>\`;
                }
            } else {`;

if (oldCarouselCheck.test(script)) {
    script = script.replace(oldCarouselCheck, newCarouselCheck);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Added default banner fallback');
} else {
    console.log('Regex failed');
}
