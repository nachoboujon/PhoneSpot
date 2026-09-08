const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target2 = `    function loadRelatedProducts(currentId, category) {
        fetch(window.API_URL + '/api/products')
            .then(res => res.json())
            .then(prods => {`;

const replacement2 = `    function loadRelatedProducts(currentId, category) {
        Promise.all([window.dolarPromise, fetch(window.API_URL + '/api/products').then(res => res.json())])
            .then(([_, prods]) => {`;

s = s.replace(target2, replacement2);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed dolar promise timing for related products');
