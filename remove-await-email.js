const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

s = s.replace(/await sendEmail\(adminEmail, '🎉 ¡Nueva Venta en PhoneSpot! - Orden #' \+ orderId, htmlContent\);/g, "sendEmail(adminEmail, '🎉 ¡Nueva Venta en PhoneSpot! - Orden #' + orderId, htmlContent);");

fs.writeFileSync('server.js', s, 'utf8');
console.log('Removed await from sendEmail');
