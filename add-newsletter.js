const fs = require('fs');
let s = fs.readFileSync('public/index.html', 'utf8');

const newsletterSection = `
        <!-- Newsletter -->
        <section class="newsletter" style="background: linear-gradient(135deg, #2e8b57, #1e6b40); padding: 4rem 5%; text-align: center; margin-top: 4rem;">
            <div style="max-width: 600px; margin: 0 auto; color: white;">
                <i class="fa-regular fa-envelope-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2 style="font-size: 2rem; margin-bottom: 1rem; color: white;">¡No te pierdas ninguna oferta!</h2>
                <p style="margin-bottom: 2rem; font-size: 1.1rem; opacity: 0.9;">Suscribite a nuestro newsletter y recibí descuentos exclusivos antes que nadie.</p>
                <form onsubmit="event.preventDefault(); alert('¡Gracias por suscribirte!'); this.reset();" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <input type="email" placeholder="Tu correo electrónico" required style="padding: 1rem; border-radius: 30px; border: none; flex: 1; min-width: 250px; font-size: 1rem; outline: none;">
                    <button type="submit" class="btn" style="background: #111; color: white; border: none; padding: 1rem 2rem; border-radius: 30px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#111'">Suscribirme</button>
                </form>
            </div>
        </section>
`;

if(!s.includes('newsletter')) {
    s = s.replace(/<\/main>/, newsletterSection + '\n    </main>');
    fs.writeFileSync('public/index.html', s, 'utf8');
}
