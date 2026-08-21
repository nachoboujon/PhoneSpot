const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldComment = "// Cambia window.API_URL + '' por la URL de tu servidor en producción (ej. 'https://tu-backend.onrender.com')";
const newComment = "// Cambia 'http://localhost:3000' por la URL de tu servidor en producción (ej. 'https://tu-backend.onrender.com')";
s = s.replace(oldComment, newComment);

fs.writeFileSync('public/script.js', s, 'utf8');
