const fs = require('fs');
let lines = fs.readFileSync('public/checkout.html', 'utf8').split('\n');

// Find the submit button
const btnIndex = lines.findIndex(l => l.includes('id="btn-confirm-pay"'));
if (btnIndex !== -1) {
    if (lines[btnIndex + 1].includes('</div>')) lines.splice(btnIndex + 1, 1);
    if (lines[btnIndex + 1].includes('</div>')) lines.splice(btnIndex + 1, 1);
    fs.writeFileSync('public/checkout.html', lines.join('\n'), 'utf8');
    console.log('Removed extra closing div tags');
} else {
    console.log('Button not found');
}
