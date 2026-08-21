const fs = require('fs');
const files = ['public/producto.html', 'public/catalogo.html', 'public/checkout.html', 'public/admin.html'];

files.forEach(file => {
    if(fs.existsSync(file)) {
        let s = fs.readFileSync(file, 'utf8');
        s = s.replace(/href="index\.html#catílogo"/g, 'href="catalogo.html?cat=all"');
        fs.writeFileSync(file, s, 'utf8');
        console.log('Fixed', file);
    }
});
