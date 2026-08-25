const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

script = script.replace('const threshold = settings.free_shipping_threshold;', 'const threshold = settings_ml.free_shipping_threshold;');

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed ReferenceError for settings');
