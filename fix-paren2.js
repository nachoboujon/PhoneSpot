const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regex = /window\.checkVariantStock\(prod\);\n\);\n\s*\}\);\n\s*window\.checkVariantStock\(prod\);/;
if (s.match(regex)) {
    s = s.replace(regex, 'window.checkVariantStock(prod);');
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed parens!');
} else {
    // try brute force string replacement of the specific lines
    const lines = s.split('\n');
    lines.splice(1270, 4);
    fs.writeFileSync('public/script.js', lines.join('\n'), 'utf8');
    console.log('Fixed parens via brute force!');
}
