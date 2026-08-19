const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    if (!s.includes('perfil.html#favoritos')) {
        s = s.replace(/<a href="carrito\.html" class="cart-icon">/, 
            '<a href="perfil.html#favoritos" title="Mis Favoritos" style="margin-right: 15px; font-size: 1.2rem; color: var(--text-color);"><i class="fa-regular fa-heart"></i></a>\n            <a href="carrito.html" class="cart-icon">');
        fs.writeFileSync('public/' + f, s, 'utf8');
    }
});
