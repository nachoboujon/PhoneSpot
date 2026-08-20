const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
const lines = s.split('\n');

// Find the illegal return statement
const returnIdx = lines.findIndex(l => l.trim().startsWith('return \'$\' + (usdPrice * window.dolarValue)'));

if (returnIdx !== -1) {
    // Check if the previous line is empty or something else
    // We just insert window.formatPrice before it, and }; after it.
    lines.splice(returnIdx, 0, 'window.formatPrice = (usdPrice) => {');
    lines.splice(returnIdx + 2, 0, '};');
    
    fs.writeFileSync('public/script.js', lines.join('\n'), 'utf8');
    console.log('Fixed window.formatPrice definition!');
} else {
    console.log('Could not find return statement');
}
