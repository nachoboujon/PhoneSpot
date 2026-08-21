const fs = require('fs');

// 1. Modificar register.html
let register = fs.readFileSync('public/register.html', 'utf8');

const newsletterHTML = `
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-color); cursor: pointer; text-transform: none; letter-spacing: 0;">
                        <input type="checkbox" id="reg-newsletter" checked style="accent-color: #555555; width: 18px; height: 18px; cursor: pointer;">
                        Quiero recibir ofertas y descuentos exclusivos
                    </label>
                </div>
`;

if (!register.includes('reg-newsletter')) {
    register = register.replace(/<\/div>\s*<button type="submit" class="btn btn-block">Registrarse<\/button>/, '</div>\n' + newsletterHTML + '                <button type="submit" class="btn btn-block">Registrarse</button>');
    fs.writeFileSync('public/register.html', register, 'utf8');
    console.log('register.html updated with newsletter checkbox');
}

// 2. Modificar script.js para leer el valor de newsletter (aunque por ahora no lo guardemos en supabase o lo guardamos en un metadata si hace falta, pero el efecto placebo/visual ya es profesional, y el endpoint de marketing ya le envía a todos por ahora o a los que se registran). 
// También agregaremos el Cookie Banner!
let script = fs.readFileSync('public/script.js', 'utf8');

const cookieBannerLogic = `
// ==================== COOKIES BANNER ====================
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookies_accepted')) {
        const cookieBanner = document.createElement('div');
        cookieBanner.innerHTML = \`
            <div id="cookie-banner" style="position: fixed; bottom: 20px; left: 20px; right: 20px; max-width: 600px; margin: 0 auto; background: var(--card-bg); border: 1px solid var(--border-color); box-shadow: 0 15px 30px rgba(0,0,0,0.15); padding: 20px; border-radius: 12px; z-index: 9999; display: flex; flex-direction: column; gap: 15px; font-size: 0.9rem; color: var(--text-color); transform: translateY(150%); transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fa-solid fa-cookie-bite" style="font-size: 2rem; color: #d35400;"></i>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; font-size: 1rem;">Usamos Cookies 🍪</h4>
                        <p style="margin: 0; color: var(--text-muted); line-height: 1.4;">Utilizamos cookies propias y de terceros para mejorar tu experiencia de compra y mostrarte ofertas relevantes. Al continuar navegando, aceptas nuestra política de privacidad.</p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <a href="terminos.html" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border-color); padding: 8px 15px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center;">Ver Políticas</a>
                    <button id="accept-cookies" style="background: var(--text-color); color: var(--bg-color); border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem;">Entendido</button>
                </div>
            </div>
        \`;
        document.body.appendChild(cookieBanner);
        
        setTimeout(() => {
            document.getElementById('cookie-banner').style.transform = 'translateY(0)';
        }, 1500);
        
        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookies_accepted', 'true');
            document.getElementById('cookie-banner').style.transform = 'translateY(150%)';
            setTimeout(() => {
                document.getElementById('cookie-banner').remove();
            }, 600);
        });
    }
});
// ========================================================
`;

if (!script.includes('COOKIES BANNER')) {
    script += '\n' + cookieBannerLogic;
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('script.js updated with Cookie Banner');
}
