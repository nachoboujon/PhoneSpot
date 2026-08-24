const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const regex = /<div class="admin-card">\s*<h4><i class="fa-solid fa-truck-fast"><\/i> Costos de Envío Nacional<\/h4>[\s\S]*?<\/div>/;

if (regex.test(html)) {
    html = html.replace(regex, '');
    fs.writeFileSync('public/admin.html', html, 'utf8');
    console.log('Removed national shipping from admin panel');
} else {
    console.log('Regex failed');
}
