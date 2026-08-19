const fs = require('fs');
let s = fs.readFileSync('public/index.html', 'utf8');

const newSections = `
        <!-- Trust Badges -->
        <section class="trust-badges" style="background: var(--card-bg); padding: 2rem 5%; border-bottom: 1px solid var(--border-color); margin-bottom: 3rem;">
            <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: center;">
                <div>
                    <i class="fa-solid fa-truck-fast" style="font-size: 2rem; color: #2e8b57; margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-color); margin-bottom: 0.5rem;">Envío Gratis</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">En compras superiores a $1.000.000</p>
                </div>
                <div>
                    <i class="fa-solid fa-shield-halved" style="font-size: 2rem; color: #2e8b57; margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-color); margin-bottom: 0.5rem;">Garantía Oficial</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">12 meses en equipos nuevos</p>
                </div>
                <div>
                    <i class="fa-solid fa-credit-card" style="font-size: 2rem; color: #2e8b57; margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-color); margin-bottom: 0.5rem;">Pagos Seguros</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Transacciones encriptadas 256-bit</p>
                </div>
                <div>
                    <i class="fa-solid fa-headset" style="font-size: 2rem; color: #2e8b57; margin-bottom: 1rem;"></i>
                    <h4 style="color: var(--text-color); margin-bottom: 0.5rem;">Soporte 24/7</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Te asesoramos vía WhatsApp</p>
                </div>
            </div>
        </section>

        <!-- Featured Categories -->
        <section class="featured-categories" style="padding: 0 5%; max-width: 1200px; margin: 0 auto 4rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                
                <a href="catalogo.html?cat=apple" style="display: block; position: relative; height: 250px; border-radius: 16px; overflow: hidden; text-decoration: none;">
                    <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80') center/cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
                    <div style="position: absolute; bottom: 20px; left: 20px; z-index: 2;">
                        <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.5rem;">Mundo Apple</h3>
                        <span style="color: #2e8b57; font-weight: bold; background: white; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">Ver Equipos</span>
                    </div>
                </a>

                <a href="catalogo.html?cat=samsung" style="display: block; position: relative; height: 250px; border-radius: 16px; overflow: hidden; text-decoration: none;">
                    <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80') center/cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
                    <div style="position: absolute; bottom: 20px; left: 20px; z-index: 2;">
                        <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.5rem;">Ecosistema Samsung</h3>
                        <span style="color: #2e8b57; font-weight: bold; background: white; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">Descubrir</span>
                    </div>
                </a>

                <a href="catalogo.html?cat=accesorios" style="display: block; position: relative; height: 250px; border-radius: 16px; overflow: hidden; text-decoration: none;">
                    <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80') center/cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"></div>
                    <div style="position: absolute; bottom: 20px; left: 20px; z-index: 2;">
                        <h3 style="color: white; font-size: 1.5rem; margin-bottom: 0.5rem;">Accesorios Premium</h3>
                        <span style="color: #2e8b57; font-weight: bold; background: white; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.8rem; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">Ver Fundas y Cargadores</span>
                    </div>
                </a>

            </div>
        </section>
`;

if(!s.includes('trust-badges')) {
    s = s.replace(/<\/section>\s*<section id="marcas"/, '</section>\n' + newSections + '\n<section id="marcas"');
    fs.writeFileSync('public/index.html', s, 'utf8');
}
