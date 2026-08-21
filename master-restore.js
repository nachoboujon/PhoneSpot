const { execSync } = require('child_process');
const fs = require('fs');

console.log('Restoring script.js to midnight...');
execSync('git restore public/script.js', {stdio: 'inherit'});

const allScripts = [
    'update-admin-products.js',
    'update-script-wholesale.js',
    'fix-wholesale-banners.js',
    'fix-crash.js',
    'fix-sidecart-banner.js',
    'fix-main-banner.js',
    'update-logos.js',
    'fix-fade-up.js',
    'fix-checkout-vars.js',
    'fix-variant-stock.js',
    'refactor-api-url.js',
    'fix-api-url.js',
    'fix-comment.js',
    'fix-duplicate.js',
    'add-emails.js',
    'fix-visuals.js',
    'fix-thumbs-zip.js',
    'fix-checkout-zip.js',
    'fix-product-ui.js',
    'fix-add-cart.js',
    'fix-cart-nan.js',
    'fix-stock-limit.js',
    'add-upload.js',
    'fix-carousel.js',
    'fix-admin-stock.js',
    'fix-badges.js',
    'fix-catalog-btns.js',
    'fix-full-catalog.js',
    'fix-variant-parse.js',
    'fix-variant-parse-regex.js',
    'fix-stock-info.js',
    'fix-variant-ui.js',
    'fix-restore-variants.js',
    'fix-product-events.js',
    're-inject-smart.js', // This replaces fix-smart-variants.js + syntax fixes
    'fix-nav.js',
    'fix-maximstore-style.js',
    'fix-layout-apple.js',
    'fix-flat-white.js',
    'revert-layout.js',
    'revert-padding.js',
    'fix-fade.js',
    'fix-typo.js',
    'add-color-helper.js',
    'update-color-circles.js',
    'fix-click.js',
    'fix-variant-cart.js',
    'clean-cart-variants.js',
    
    // NEW SCRIPTS
    'fix-double-else.js', // Make sure no double else
    'fix-paren2.js', // Clean parens
    'add-var-price.js',
    'add-var-price-js.js',
    'add-dynamic-price-id.js',
    'update-variant-price.js',
    'update-data-price.js',
    'move-price-back.js',
    'fix-related-price.js',
    'add-inline-price.js'
];

for(let s of allScripts) {
    if (!fs.existsSync(s)) continue;
    console.log('\\n--- Running ' + s + ' ---');
    try { execSync('node ' + s, {stdio: 'inherit'}); }
    catch(e) { console.error('FAILED ON ' + s); }
}

console.log('\\nChecking syntax...');
try { execSync('node -c public/script.js', {stdio: 'inherit'}); console.log('SYNTAX OK!'); }
catch(e) { console.error('SYNTAX ERROR'); process.exit(1); }
