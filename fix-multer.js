const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const oldMulterRegex = /\/\/ Configuración de multer \(motor para guardar archivos locales\)[\s\S]*?const upload = multer\(\{ storage: storage \}\);/;
const newMulter = `// Configuración de multer (motor en memoria para subir a Supabase Storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });`;

if (oldMulterRegex.test(server)) {
    server = server.replace(oldMulterRegex, newMulter);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Multer configured for memory storage');
} else {
    console.log('Multer regex failed');
}
