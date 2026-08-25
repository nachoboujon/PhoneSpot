const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.split("total.toFixed(2) + ' USD'").join("'$' + (Math.round(total * (Number(req.body.dolar_value) || 1400))).toLocaleString('es-AR') + ' ARS'");

fs.writeFileSync('server.js', s, 'utf8');
console.log('Replaced USD total with ARS total in emails');
