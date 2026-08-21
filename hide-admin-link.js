const fs = require('fs');

['public/index.html', 'public/catalogo.html', 'public/producto.html', 'public/carrito.html', 'public/checkout.html', 'public/perfil.html', 'public/login.html', 'public/register.html', 'public/garantias.html', 'public/terminos.html'].forEach(file => {
    try {
        if (fs.existsSync(file)) {
            let html = fs.readFileSync(file, 'utf8');
            // Hide the admin link in the footer
            html = html.replace(/<a href="admin\.html">Panel de Control<\/a>/g, '<a href="admin.html" class="footer-admin-link" style="display:none;">Panel de Control</a>');
            fs.writeFileSync(file, html, 'utf8');
        }
    } catch(e) { console.log(e); }
});

let script = fs.readFileSync('public/script.js', 'utf8');
const adminLinkLogic = `
window.addEventListener('DOMContentLoaded', () => {
    const adminLinks = document.querySelectorAll('.footer-admin-link');
    if (localStorage.getItem('role') === 'admin') {
        adminLinks.forEach(link => link.style.display = 'inline-block');
    }
});
`;
if (!script.includes('.footer-admin-link')) {
    script += '\n' + adminLinkLogic;
    fs.writeFileSync('public/script.js', script, 'utf8');
}
console.log('Footer admin links hidden for clients');
