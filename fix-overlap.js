const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

// Change height: 80px back to something responsive or auto, so the text doesn't overlap
css = css.replace(/height: 80px !important;/g, 'height: auto !important; min-height: 80px; aspect-ratio: 1/1;');

// Fix max-width of product images so they never break the container
css += `
.product-card .product-img {
    max-height: 120px !important;
    width: 100% !important;
    object-fit: contain !important;
    position: relative !important;
}
`;

fs.writeFileSync('public/style.css', css, 'utf8');
console.log('Fixed product image overlap');
