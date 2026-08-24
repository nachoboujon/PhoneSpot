const fs = require('fs');

const files = [
    'public/index.html', 'public/catalogo.html', 'public/producto.html', 
    'public/carrito.html', 'public/checkout.html', 'public/perfil.html', 
    'public/login.html', 'public/register.html', 'public/admin.html', 
    'public/garantias.html', 'public/terminos.html'
];

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            let html = fs.readFileSync(file, 'utf8');
            
            // Replace Instagram link
            html = html.replace(/https:\/\/instagram\.com\/TU_USUARIO/g, 'https://www.instagram.com/phonespotsj');
            
            fs.writeFileSync(file, html, 'utf8');
        }
    } catch(e) { console.error(e); }
});
console.log('Instagram link injected');
