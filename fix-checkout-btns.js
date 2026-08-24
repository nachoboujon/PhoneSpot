const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

// Fix Next button
html = html.replace(/<button type="button" class="btn" onclick="nextCheckoutStep\(\)"/g, '<button type="button" id="btnNext" class="btn"');

// Fix Prev button
html = html.replace(/<button type="button" onclick="prevCheckoutStep\(\)"/g, '<button type="button" id="btnPrev"');

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('Fixed checkout.html buttons');
