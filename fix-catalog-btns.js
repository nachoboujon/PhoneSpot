const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexBtn = /<a href="#" class="btn btn-block add-to-cart-btn">\s*\$\{prod\.is_offer \? 'Aprovechar Oferta' : 'Añadir al carrito'\}\s*<\/a>/g;

const newBtn = `<button class="btn btn-block add-to-cart-btn" \${prod.stock <= 0 ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ''}>
                        \${prod.stock <= 0 ? 'Sin Stock' : (prod.is_offer ? 'Aprovechar Oferta' : 'Añadir al carrito')}
                    </button>`;

if(s.match(regexBtn)) {
    s = s.replace(regexBtn, newBtn);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed catalog buttons');
} else {
    console.log('Not found');
}
