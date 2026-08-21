const fs = require('fs');
let html = fs.readFileSync('public/catalogo.html', 'utf8');

const scriptStr = `
    <script>
        if(window.innerWidth <= 768) {
            document.querySelectorAll('#filters-sidebar details').forEach(d => d.removeAttribute('open'));
        }
    </script>
</body>`;

if (!html.includes('if(window.innerWidth <= 768)')) {
    html = html.replace('</body>', scriptStr);
    fs.writeFileSync('public/catalogo.html', html, 'utf8');
    console.log('Added mobile JS');
}
