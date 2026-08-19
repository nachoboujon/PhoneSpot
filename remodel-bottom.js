const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// Replace the Ofertas section completely
const oldOfertas = `<section id="ofertas" class="offers-section">
            <h3>Ofertas del Da</h3>
            <div class="product-grid" id="offers-container">
                <!-- Los productos en oferta se cargarǭn aqu desde Supabase -->
                <p style="color: var(--text-muted);">Cargando ofertas espectaculares...</p>
            </div>
        </section>`;

const newOfertas = `
        <!-- SECCIÓN DE OFERTAS MEJORADA -->
        <section id="ofertas" class="offers-section" style="padding: 5rem 5%; background: var(--bg-color);">
            <div style="text-align: center; margin-bottom: 3rem;">
                <span style="background: #ff4757; color: white; padding: 0.3rem 1rem; border-radius: 20px; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Descuentos Exclusivos</span>
                <h3 style="font-size: 2.5rem; color: var(--text-color); margin-top: 1rem; margin-bottom: 0.5rem;">Ofertas Relámpago</h3>
                <p style="color: var(--text-muted); font-size: 1.1rem;">Equipos premium con precios imbatibles por tiempo limitado.</p>
            </div>
            
            <div class="product-grid" id="offers-container">
                <p style="color: var(--text-muted); text-align: center; width: 100%;">Cargando ofertas espectaculares...</p>
            </div>
        </section>
`;

html = html.replace(/<section id="ofertas" class="offers-section">[\s\S]*?<\/section>/, newOfertas);

// Replace the Catalogo Destacado section completely, and add a Banner & Testimonials before it
const oldCatalogo = `<section id="catlogo" class="products">
            <h3>Catǭlogo Destǭcado</h3>
            <div class="product-grid" id="catalog-container">
                <!-- Los productos regulares se cargarǭn aqu desde Supabase -->
                <p style="color: var(--text-muted);">Cargando catlogo premium...</p>
            </div>
        </section>`;

const newCatalogo = `
        <!-- PROMO BANNER PARALLAX -->
        <section style="margin: 4rem 0; height: 400px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1920&q=80') center/cover fixed; z-index: 1;"></div>
            <div style="position: relative; z-index: 2; text-align: center; color: white; max-width: 800px; padding: 0 2rem;">
                <h2 style="font-size: 3rem; margin-bottom: 1rem; font-weight: 900; text-shadow: 0 4px 15px rgba(0,0,0,0.5);">Ecosistema Completo</h2>
                <p style="font-size: 1.2rem; margin-bottom: 2rem; color: #f0f0f0;">Potenciá tu celular con los mejores accesorios. Smartwatches, auriculares TWS y fundas premium.</p>
                <a href="catalogo.html?cat=accesorios" class="btn" style="background: white; color: #111; padding: 1rem 3rem; border-radius: 30px; font-weight: bold; text-decoration: none; text-transform: uppercase; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Ver Accesorios</a>
            </div>
        </section>

        <!-- CATÁLOGO DESTACADO MEJORADO -->
        <section id="catálogo" class="products" style="padding: 5rem 5%; background: var(--bg-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 2.5rem; color: var(--text-color); margin-bottom: 0.5rem;">Nuevos Ingresos</h3>
                    <p style="color: var(--text-muted); font-size: 1.1rem;">La última tecnología recién llegada a PhoneSpot.</p>
                </div>
                <a href="catalogo.html?cat=all" style="color: #555555; text-decoration: none; font-weight: bold; border-bottom: 2px solid #555555; padding-bottom: 2px; transition: 0.3s;" onmouseover="this.style.color='#111'; this.style.borderColor='#111';" onmouseout="this.style.color='#555555'; this.style.borderColor='#555555';">Ver todo el catálogo <i class="fa-solid fa-arrow-right" style="margin-left: 5px;"></i></a>
            </div>
            
            <div class="product-grid" id="catalog-container">
                <p style="color: var(--text-muted); text-align: center; width: 100%;">Cargando catálogo premium...</p>
            </div>
        </section>

        <!-- TESTIMONIOS (SOCIAL PROOF) -->
        <section style="padding: 5rem 5%; background: var(--card-bg); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
            <div style="text-align: center; margin-bottom: 4rem;">
                <h3 style="font-size: 2.5rem; color: var(--text-color); margin-bottom: 0.5rem;">Lo que dicen nuestros clientes</h3>
                <p style="color: var(--text-muted); font-size: 1.1rem;">Miles de usuarios confían en PhoneSpot para renovar su tecnología.</p>
            </div>

            <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <!-- Review 1 -->
                <div style="background: var(--bg-color); padding: 2rem; border-radius: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <div style="display: flex; gap: 4px; color: #f39c12; margin-bottom: 1rem; font-size: 1.2rem;">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    </div>
                    <p style="color: var(--text-color); font-style: italic; line-height: 1.6; margin-bottom: 1.5rem;">"Compré un iPhone 15 Pro Max y me llegó al día siguiente a Entre Ríos. La atención por WhatsApp fue impecable, me sacaron todas las dudas. 100% recomendados."</p>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h4 style="color: var(--text-color); margin: 0; font-size: 1rem;">Martín S.</h4>
                            <span style="color: #2e8b57; font-size: 0.8rem; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Comprador Verificado</span>
                        </div>
                    </div>
                </div>

                <!-- Review 2 -->
                <div style="background: var(--bg-color); padding: 2rem; border-radius: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <div style="display: flex; gap: 4px; color: #f39c12; margin-bottom: 1rem; font-size: 1.2rem;">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                    </div>
                    <p style="color: var(--text-color); font-style: italic; line-height: 1.6; margin-bottom: 1.5rem;">"Excelente la garantía. Tuve un temita con el pin de carga de un Motorola a los 3 meses, me lo tomaron por garantía y me lo solucionaron rapidísimo. Un lujo."</p>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h4 style="color: var(--text-color); margin: 0; font-size: 1rem;">Luciana Gómez</h4>
                            <span style="color: #2e8b57; font-size: 0.8rem; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Compradora Verificada</span>
                        </div>
                    </div>
                </div>

                <!-- Review 3 -->
                <div style="background: var(--bg-color); padding: 2rem; border-radius: 16px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <div style="display: flex; gap: 4px; color: #f39c12; margin-bottom: 1rem; font-size: 1.2rem;">
                        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <p style="color: var(--text-color); font-style: italic; line-height: 1.6; margin-bottom: 1.5rem;">"Muy buenos precios, aproveché una oferta relámpago de Samsung y pagué mucho menos que en las tiendas oficiales. Todo en caja sellada."</p>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h4 style="color: var(--text-color); margin: 0; font-size: 1rem;">Diego F.</h4>
                            <span style="color: #2e8b57; font-size: 0.8rem; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Comprador Verificado</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
`;

html = html.replace(/<section id="cat[a]logo" class="products">[\s\S]*?<\/section>/, newCatalogo);
fs.writeFileSync('public/index.html', html, 'utf8');

// I also noticed that the green color #2e8b57 was left in the reviews verification checks ("Comprador verificado").
// I will quickly replace that with the gray theme #555555.
html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/color: #2e8b57/g, 'color: #555555');
fs.writeFileSync('public/index.html', html, 'utf8');
