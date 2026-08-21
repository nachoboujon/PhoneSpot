const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexUpdateCartData = /const priceEl = document\.getElementById\('dynamic-price'\);/;
const replacementUpdateCartData = `const container = document.querySelector('.product-details');
                            if (container) container.dataset.price = priceToUse;
                            const priceEl = document.getElementById('dynamic-price');`;

// Because the stock check might happen multiple times, I will globally replace this line
s = s.replace(new RegExp(regexUpdateCartData, 'g'), replacementUpdateCartData);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Updated container data-price');
