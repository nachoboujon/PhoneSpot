const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const lines = s.split('\n');
const idx = lines.findIndex(l => l.includes('<strong style="color:#0071e3">'));

if (idx !== -1) {
    lines[idx] = `                        <span style="font-size:0.85rem;">\${v.color} - \${v.capacity} - \${v.ram} (Stock: \${v.stock})\${v.price ? ' - <strong style="color:#0071e3">$' + v.price + '</strong>' : ''}</span>`;
    fs.writeFileSync('public/script.js', lines.join('\n'), 'utf8');
    console.log('Fixed regex injection bug!');
} else {
    console.log('Could not find line 1893 exact string');
}
