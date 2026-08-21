const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

s = s.replace(/        \}\n    \} catch \(e\) \{/, '        }\n    }\n    } catch (e) {');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed try-catch bracket syntax error');
