const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    const fullPath = path.join('public', f);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Regular PhoneSpot. replacing
    if (content.includes('<h1><a href="index.html">PhoneSpot.</a></h1>')) {
        content = content.replace('<h1><a href="index.html">PhoneSpot.</a></h1>', 
        '<h1><a href="index.html" style="display:flex; align-items:center; gap:0.5rem;"><img src="uploads/PhoneSpot-trans.png" alt="PhoneSpot Logo" style="height:35px; width:auto; border-radius: 4px;"> PhoneSpot.</a></h1>');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated exactly', f);
    } 
    // In case there are some spaces or different quotes
    else if (content.match(/<h1>\s*<a href="index\.html">\s*PhoneSpot\.\s*<\/a>\s*<\/h1>/i)) {
        content = content.replace(/<h1>\s*<a href="index\.html">\s*PhoneSpot\.\s*<\/a>\s*<\/h1>/i, 
        '<h1><a href="index.html" style="display:flex; align-items:center; gap:0.5rem;"><img src="uploads/PhoneSpot-trans.png" alt="PhoneSpot Logo" style="height:35px; width:auto; border-radius: 4px;"> PhoneSpot.</a></h1>');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated with regex', f);
    }
});
