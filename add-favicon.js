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
            if (!html.includes('rel="icon"')) {
                html = html.replace('</head>', '    <link rel="icon" type="image/png" href="uploads/PhoneSpot-trans.png">\n</head>');
                fs.writeFileSync(file, html, 'utf8');
            }
        }
    } catch(e) { console.error(e); }
});
console.log('Favicon added to all pages');
