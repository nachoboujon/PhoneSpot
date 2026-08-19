const fs = require('fs');
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let html = fs.readFileSync('public/' + f, 'utf8');
    
    // Remove the anti-flicker script
    html = html.replace(/<script>if\(localStorage\.getItem\('phoneSpotTheme'\) === 'dark'\) document\.body\.classList\.add\('dark-mode'\);<\/script>/g, '');
    
    // Remove the theme-toggle button
    html = html.replace(/<a href="#" id="theme-toggle"[^>]*>.*?<\/a>\s*/g, '');
    
    // For admin.html specifically, there might be a gap div left empty or weird formatting, let's just make sure we remove the toggle.
    fs.writeFileSync('public/' + f, html, 'utf8');
});
