const { execSync } = require('child_process');
const scripts = [
    'fix-smart-variants.js',
    'fix-maximstore-style.js',
    'fix-layout-apple.js',
    'fix-fade.js',
    'fix-typo.js',
    'fix-variant-cart.js',
    'add-color-helper.js',
    'update-color-circles.js',
    'fix-click.js'
];
for(let s of scripts) {
    console.log('Running ' + s);
    try { execSync('node ' + s, {stdio: 'inherit'}); }
    catch(e) { console.error('Failed on ' + s); }
}
console.log('Done');
