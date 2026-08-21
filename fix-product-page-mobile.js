const fs = require('fs');

let css = fs.readFileSync('public/style.css', 'utf8');

// The HTML uses class="product-details", but my CSS targeted "product-details-grid"
css = css.replace(/\.product-details-grid/g, '.product-details');

fs.writeFileSync('public/style.css', css, 'utf8');
console.log('Fixed CSS class mismatch for product page');

// Let's also check if there's any inline style we can remove from script.js line 1098 to make it cleaner
let script = fs.readFileSync('public/script.js', 'utf8');

// Let's add a global CSS for product-details instead of inline
const productDetailsCSS = `
.product-details {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 3rem;
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.06);
}
@media (max-width: 1024px) {
    .product-details {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
}
@media (max-width: 768px) {
    .product-details {
        padding: 1.5rem !important;
        gap: 1.5rem !important;
        border-radius: 0 !important;
    }
}
`;

if (!css.includes('.product-details {')) {
    css += '\n' + productDetailsCSS;
    fs.writeFileSync('public/style.css', css, 'utf8');
}

// Strip the inline style from script.js so it relies entirely on the class
script = script.replace(/class="product-details"[^>]*style="display:grid; grid-template-columns:1fr 1\.1fr;[^>]*"/g, (match) => {
    // Keep data attributes but strip style
    return match.replace(/style="[^"]*"/, '');
});

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Product page inline styles removed and converted to responsive CSS');
