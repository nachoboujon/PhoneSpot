const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexCartCheck = /if \(rawCart\) cart = JSON\.parse\(rawCart\) \|\| \[\];/;

const newCartCheck = `if (rawCart) {
        cart = JSON.parse(rawCart) || [];
        cart = cart.filter(item => item.price && !isNaN(item.price));
    }`;

if (s.match(regexCartCheck)) {
    s = s.replace(regexCartCheck, newCartCheck);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed cart read protection');
} else {
    console.log('Not found cart check');
}
