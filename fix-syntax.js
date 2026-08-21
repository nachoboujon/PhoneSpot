const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Revert those specific lines to use a cleaner syntax
s = s.replace(/onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity - 1\}, '\$\{\(item\.variant_name\|\|\\\'\\\'\)\.replace\(\/'\/g, \\"\\\\\'\\"\)\}'\)"/g, 
              `onclick="changeQuantity('\${item.id}', \${item.quantity - 1}, '\${(item.variant_name || \\'\\').replace(/\\'/g, \\"\\\\\\'\\")}')"`);
              
s = s.replace(/onclick="changeQuantity\('\$\{item\.id\}', \$\{item\.quantity \+ 1\}, '\$\{\(item\.variant_name\|\|\\\'\\\'\)\.replace\(\/'\/g, \\"\\\\\'\\"\)\}'\)"/g, 
              `onclick="changeQuantity('\${item.id}', \${item.quantity + 1}, '\${(item.variant_name || \\'\\').replace(/\\'/g, \\"\\\\\\'\\")}')"`);

s = s.replace(/onclick="removeFromCart\('\$\{item\.id\}', '\$\{\(item\.variant_name\|\|\\\'\\\'\)\.replace\(\/'\/g, \\"\\\\\'\\"\)\}'\)"/g, 
              `onclick="removeFromCart('\${item.id}', '\${(item.variant_name || \\'\\').replace(/\\'/g, \\"\\\\\\'\\")}')"`);

s = s.replace(/onchange="changeQuantity\('\$\{item\.id\}', parseInt\(this\.value\), '\$\{\(item\.variant_name\|\|\\\'\\\'\)\.replace\(\/'\/g, \\"\\\\\'\\"\)\}'\)"/g, 
              `onchange="changeQuantity('\${item.id}', parseInt(this.value), '\${(item.variant_name || \\'\\').replace(/\\'/g, \\"\\\\\\'\\")}')"`);

// Let's just use a simpler replacement if regex fails
fs.writeFileSync('public/fix.js', s);
