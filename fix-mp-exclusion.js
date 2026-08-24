const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regex = /payment_methods: \{[\s\S]*?installments: 1\s*\}/m;

if (regex.test(s)) {
    s = s.replace(regex, "payment_methods: { installments: 1 }");
    fs.writeFileSync('server.js', s);
    console.log('Removed credit_card exclusion temporarily to test');
} else {
    console.log('Regex failed');
}
