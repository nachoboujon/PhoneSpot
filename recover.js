const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');
const lines = s.split('\n');

let middleIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('+ (usdPrice * window.dolarValue).toLocaleString(')) {
        middleIndex = i;
        break;
    }
}

if (middleIndex !== -1) {
    const correctLines = [
        ...lines.slice(0, 8),
        "    return '$' + (usdPrice * window.dolarValue).toLocaleString('es-AR');",
        ...lines.slice(middleIndex + 2)
    ];
    fs.writeFileSync('public/script.js', correctLines.join('\n'), 'utf8');
    console.log('Recovered file! Length:', correctLines.length);
} else {
    console.log('Could not find middle index.');
}
