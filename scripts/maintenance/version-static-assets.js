const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const publicDir = path.resolve(__dirname, '../../public');
const versions = Object.fromEntries(['script.js', 'style.css', 'cart-actions.js', 'cart-actions.css', 'checkout-ui.js', 'checkout-ui.css', 'home-ui.js', 'home-ui.css'].map(file => [file,
    crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir, file))).digest('hex').slice(0, 12)]));
for (const file of fs.readdirSync(publicDir).filter(file => file.endsWith('.html'))) {
    const filePath = path.join(publicDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    let prepared = html;
    if (/src="script\.js/.test(html) && !html.includes('src="cart-actions.js')) {
        prepared = prepared.replace(/(<script src="script\.js)/, '<script src="cart-actions.js"></script>\n    $1');
        prepared = prepared.replace('</head>', '    <link rel="stylesheet" href="cart-actions.css">\n</head>');
    }
    const updated = prepared.replace(/((?:src|href)=")(script\.js|style\.css|cart-actions\.js|cart-actions\.css|checkout-ui\.js|checkout-ui\.css|home-ui\.js|home-ui\.css)(?:\?[^"\s]*)?(")/g,
        (_, prefix, asset, suffix) => `${prefix}${asset}?v=${versions[asset]}${suffix}`);
    if (updated !== html) fs.writeFileSync(filePath, updated);
}
console.log('Static asset versions:', versions);
