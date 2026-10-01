const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const publicDir = path.resolve(__dirname, '../../public');
const versions = Object.fromEntries(['script.js', 'style.css', 'cart-actions.js', 'cart-actions.css', 'checkout-ui.js', 'checkout-ui.css', 'home-ui.js', 'home-ui.css', 'admin-offers.js', 'admin-offers.css', 'admin-ui.js', 'admin-ui.css', 'favorites-ui.js', 'product-image-framing.js'].map(file => [file,
    crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir, file))).digest('hex').slice(0, 12)]));
for (const file of fs.readdirSync(publicDir).filter(file => file.endsWith('.html'))) {
    const filePath = path.join(publicDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    let prepared = html;
    if (/src="script\.js/.test(html) && !html.includes('src="cart-actions.js')) {
        prepared = prepared.replace(/(<script src="script\.js)/, '<script src="cart-actions.js"></script>\n    $1');
        prepared = prepared.replace('</head>', '    <link rel="stylesheet" href="cart-actions.css">\n</head>');
    }
    if (/src="script\.js/.test(prepared) && !prepared.includes('src="favorites-ui.js')) {
        prepared = prepared.replace(/(<script src="cart-actions\.js)/, '<script src="favorites-ui.js"></script>\n    <script src="product-image-framing.js"></script>\n    $1');
    }
    if (/src="script\.js/.test(prepared) && !prepared.includes('src="product-commercial-types.js')) {
        const version = crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir, 'product-commercial-types.js'))).digest('hex').slice(0, 12);
        prepared = prepared.replace(/(<script src="favorites-ui\.js)/, `<script src="product-commercial-types.js?v=${version}"></script>\n    $1`);
    }
    const commercialVersion = crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir, 'product-commercial-types.js'))).digest('hex').slice(0, 12);
    prepared = prepared.replace(/src="product-commercial-types\.js(?:\?[^"\s]*)?"/g, `src="product-commercial-types.js?v=${commercialVersion}"`);
    const updated = prepared.replace(/((?:src|href)=")(script\.js|style\.css|cart-actions\.js|cart-actions\.css|checkout-ui\.js|checkout-ui\.css|home-ui\.js|home-ui\.css|admin-offers\.js|admin-offers\.css|admin-ui\.js|admin-ui\.css|favorites-ui\.js|product-image-framing\.js)(?:\?[^"\s]*)?(")/g,
        (_, prefix, asset, suffix) => `${prefix}${asset}?v=${versions[asset]}${suffix}`);
    if (updated !== html) fs.writeFileSync(filePath, updated);
}
console.log('Static asset versions:', versions);
