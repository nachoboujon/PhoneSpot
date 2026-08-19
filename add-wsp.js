const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

const floatBtn = `
    <!-- WhatsApp Flotante -->
    <a href="https://wa.me/5493447416011" class="whatsapp-float" target="_blank" title="Chatea con nosotros">
        <i class="fa-brands fa-whatsapp"></i>
    </a>
`;

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    if (!s.includes('whatsapp-float') && !f.includes('admin.html')) {
        s = s.replace(/<\/body>/, floatBtn + '\n</body>');
        fs.writeFileSync('public/' + f, s, 'utf8');
    }
});
