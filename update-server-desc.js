const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regex = /const \{ stock, price, variants \} = req.body;/g;
const newStr = `const { stock, price, variants, description } = req.body;\n        if (description !== undefined) updateData.description = description;`;

if (regex.test(s)) {
    s = s.replace(regex, newStr);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Updated server PUT route for description');
} else {
    console.log('Regex failed');
}
