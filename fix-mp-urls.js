const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regex1 = /'http:\/\/localhost:3000\/perfil\.html'/g;
s = s.replace(regex1, "req.headers.origin + '/perfil.html'");

const regex2 = /'http:\/\/localhost:3000\/carrito\.html'/g;
s = s.replace(regex2, "req.headers.origin + '/carrito.html'");

const regex3 = /'http:\/\/localhost:3000\/compra-exitosa\.html'/g;
s = s.replace(regex3, "req.headers.origin + '/compra-exitosa.html'");

const regex4 = /'http:\/\/localhost:3000\/index\.html\?pago=error'/g;
s = s.replace(regex4, "req.headers.origin + '/index.html?pago=error'");

const regex5 = /'http:\/\/localhost:3000\/index\.html\?pago=pendiente'/g;
s = s.replace(regex5, "req.headers.origin + '/index.html?pago=pendiente'");

fs.writeFileSync('server.js', s, 'utf8');
console.log('Fixed localhost hardcoded back_urls in server.js');
