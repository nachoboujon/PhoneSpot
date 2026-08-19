const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldLogicRegex = /if \(distance < 0\) \{[\s\S]*?return;\s*\}/;
const newLogic = `if (distance < 0) {
            cdContainer.style.display = 'none';
            // Hide the entire offers section
            const offersSection = document.getElementById('ofertas');
            if (offersSection) {
                offersSection.style.display = 'none';
            }
            return;
        }`;

if(s.match(oldLogicRegex)) {
    s = s.replace(oldLogicRegex, newLogic);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Countdown logic updated to hide section.');
} else {
    console.log('Regex did not match.');
}
