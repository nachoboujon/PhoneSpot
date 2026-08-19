const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    // We will add the admin link next to "Inicio" in the footer links
    const target = '<li><a href="index.html" style="color: #aaa; text-decoration: none; transition: 0.3s;">Inicio</a></li>';
    const adminLink = '<li><a href="admin.html" style="color: #aaa; text-decoration: none; transition: 0.3s;">🔑 Panel de Control</a></li>';
    
    if (s.includes(target) && !s.includes('Panel de Control')) {
        s = s.replace(target, target + '\n                    ' + adminLink);
        fs.writeFileSync('public/' + f, s, 'utf8');
    }
});
console.log('Admin link added to footer.');
