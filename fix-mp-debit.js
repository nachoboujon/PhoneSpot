const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const oldPref = /const preferenceData = \{[\s\S]*?notification_url: 'https:\/\/phonespot\.site\/api\/mercadopago\/webhook'\s*\};/;
const newPref = `const preferenceData = {
                items: mpItems,
                payer: { name: customer_name, email: customer_email },
                back_urls: {
                    success: req.headers.origin + '/perfil.html?pago=exito',
                    failure: req.headers.origin + '/carrito.html?pago=error',
                    pending: req.headers.origin + '/perfil.html?pago=pendiente'
                },
                auto_return: 'approved',
                external_reference: orderId.toString(),
                notification_url: 'https://phonespot.site/api/mercadopago/webhook',
                payment_methods: {
                    excluded_payment_types: [
                        { id: 'credit_card' }
                    ],
                    installments: 1
                }
            };`;

if (oldPref.test(server)) {
    server = server.replace(oldPref, newPref);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Added debit card limitation to Mercado Pago preference');
} else {
    console.log('Regex failed');
}
