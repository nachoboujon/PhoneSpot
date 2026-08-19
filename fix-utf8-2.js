const fs = require('fs');
const path = require('path');
const dir = 'public';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        content = content.replace(/Ofrecem.s/g, 'Ofrecemos');
        content = content.replace(/D.a/g, 'Día');
        content = content.replace(/B.SQUEDA/g, 'BÚSQUEDA');
        content = content.replace(/tecnolog.a/g, 'tecnología');
        content = content.replace(/garant.a/g, 'garantía');
        content = content.replace(/vac.o/g, 'vacío');
        content = content.replace(/A.adir/g, 'Añadir');
        content = content.replace(/Env.os/g, 'Envíos');
        content = content.replace(/Env.o/g, 'Envío');
        content = content.replace(/Estad.sticas/g, 'Estadísticas');
        content = content.replace(/M.todo/g, 'Método');
        content = content.replace(/cat.logo/g, 'catálogo');
        content = content.replace(/Cat.logo/g, 'Catálogo');
        content = content.replace(/Categor.a/g, 'Categoría');
        content = content.replace(/Dise.o/g, 'Diseño');
        content = content.replace(/.rdenes/g, 'Órdenes');
        content = content.replace(/pa.s/g, 'país');
        content = content.replace(/d.as/g, 'días');
        content = content.replace(/h.biles/g, 'hábiles');
        content = content.replace(/direcci.n/g, 'dirección');
        content = content.replace(/Colecci.n/g, 'Colección');
        content = content.replace(/descripci.n/g, 'descripción');
        content = content.replace(/conexi.n/g, 'conexión');
        content = content.replace(/Sesi.n/g, 'Sesión');
        content = content.replace(/Informaci.n/g, 'Información');
        content = content.replace(/R.pidos/g, 'Rápidos');
        content = content.replace(/ma.ana/g, 'mañana');
        content = content.replace(/est.s/g, 'estás');
        content = content.replace(/Est.s/g, 'Estás');
        content = content.replace(/est.n/g, 'están');
        content = content.replace(/est./g, 'está');
        content = content.replace(/Est./g, 'Está');
        content = content.replace(/m.s/g, 'más');
        content = content.replace(/Men./g, 'Menú');
        content = content.replace(/.til/g, 'útil');
        content = content.replace(/\uFFFD/g, 'í'); 
        
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
