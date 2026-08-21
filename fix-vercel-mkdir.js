const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regexMkdir = /const uploadDir = path\.join\(__dirname, 'public', 'uploads'\);\s*if \(\!fs\.existsSync\(uploadDir\)\) \{\s*fs\.mkdirSync\(uploadDir, \{ recursive: true \}\);\s*\}/;
const newMkdir = `const uploadDir = path.join(__dirname, 'public', 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (e) {
    console.log('Read-only file system (Vercel). Uploads directory not created.');
}`;

s = s.replace(regexMkdir, newMkdir);
fs.writeFileSync('server.js', s, 'utf8');
console.log('Wrapped mkdirSync in try/catch for Vercel');
