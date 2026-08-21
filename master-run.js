const { execSync } = require('child_process');

console.log('Restoring script.js...');
execSync('git restore public/script.js', {stdio: 'inherit'});

const scripts = [
    're-inject-smart.js',
    'fix-syntax-2.js',
    'fix-maximstore-style.js',
    'fix-layout-apple.js',
    'fix-fade.js',
    'fix-typo.js',
    'fix-variant-cart.js',
    'add-color-helper.js',
    'update-color-circles.js',
    'fix-click.js',
    'clean-cart-variants.js'
];

for(let s of scripts) {
    console.log('\\n--- Running ' + s + ' ---');
    try { execSync('node ' + s, {stdio: 'inherit'}); }
    catch(e) { console.error('FAILED ON ' + s); process.exit(1); }
}

console.log('\\nChecking syntax...');
try { execSync('node -c public/script.js', {stdio: 'inherit'}); console.log('SYNTAX OK!'); }
catch(e) { console.error('SYNTAX ERROR'); process.exit(1); }
