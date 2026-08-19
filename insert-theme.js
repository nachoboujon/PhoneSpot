const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    s = s.replace(
        /<a href="carrito\.html" class="cart-icon">/,
        '<a href="#" id="theme-toggle" title="Cambiar Tema" style="margin-right: 15px; font-size: 1.2rem;"><i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i></a>\n            <a href="carrito.html" class="cart-icon">'
    );
    fs.writeFileSync('public/' + f, s, 'utf8');
});
