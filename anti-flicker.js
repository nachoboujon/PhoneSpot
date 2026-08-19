const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let html = fs.readFileSync('public/' + f, 'utf8');
    if (!html.includes("localStorage.getItem('phoneSpotTheme') === 'dark'")) {
        html = html.replace(/<body[^>]*>/, match => match + "\n    <script>if(localStorage.getItem('phoneSpotTheme') === 'dark') document.body.classList.add('dark-mode');</script>");
        fs.writeFileSync('public/' + f, html, 'utf8');
    }
});
