const fs = require('fs');
const path = require('path');

const dir = 'public';
const files = fs.readdirSync(dir);

const replacements = {
    'catologo': 'catálogo',
    'Catologo': 'Catálogo',
    'Categora': 'Categoría',
    'Diseo': 'Diseño',
    'Dise' : 'Diseñ',
    'Aadir': 'Añadir',
    'Descripcin': 'Descripción',
    'Coleccin': 'Colección',
    'vaco': 'vacío',
    'Funcin': 'Función',
    'Mltiple': 'Múltiple',
    '"rdenes': 'Órdenes',
    'Estadsticas': 'Estadísticas',
    'Sesin': 'Sesión',
    'Envo': 'Envío',
    'conexin': 'conexión',
    'tecnologa': 'tecnología',
    'garanta': 'garantía',
    'mvil': 'móvil',
    'dinomicamente': 'dinámicamente',
    'automoticamente': 'automáticamente',
    'Estos': '¿Estás',
    'estos': 'estás',
    'esto': 'está',
    'Esto': 'Está',
    'M?todo': 'Método',
    'est?': 'esté',
    'Vuelve': '¡Vuelve',
    'maana': 'mañana',
    'Ropidos': 'Rápidos',
    'hobiles': 'hábiles',
    'mos': 'más',
    'logstica': 'logística',
    'das': 'días',
    'pas': 'país',
    'direccin': 'dirección',
    'Seguro': '¿Seguro',
    'Ao': 'Año',
    'BsSQUEDA': 'BÚSQUEDA',
    'Estad?STICAS': 'ESTADÍSTICAS',
    'L"GICA': 'LÓGICA',
    'nica': 'única',
    'ltimos': 'últimos',
    'utilera': 'utilería'
};

files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        let changed = false;
        for (const [bad, good] of Object.entries(replacements)) {
            if (content.includes(bad)) {
                content = content.split(bad).join(good);
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed', file);
        }
    }
});

// Fix server.js as well
let serverContent = fs.readFileSync('server.js', 'utf8');
let serverChanged = false;
for (const [bad, good] of Object.entries(replacements)) {
    if (serverContent.includes(bad)) {
        serverContent = serverContent.split(bad).join(good);
        serverChanged = true;
    }
}
if (serverChanged) {
    fs.writeFileSync('server.js', serverContent, 'utf8');
    console.log('Fixed server.js');
}
