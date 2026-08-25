const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace("const dl = document.getElementById('city-options');\n                                dl.innerHTML = '';", "const dl = document.getElementById('city-options');\n                                if (dl) dl.innerHTML = '';");
s = s.replace("dl.appendChild(option);", "if (dl) dl.appendChild(option);");

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed missing dl check in script.js');
