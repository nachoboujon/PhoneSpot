const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const customerEmailInjection = `
            // Email de confirmación AL CLIENTE
            if (customer_email) {
                const orderHtml = \`
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                        <div style="background: #00a650; color: #fff; padding: 20px; text-align: center;">
                            <h1>¡Compra Confirmada!</h1>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hola <b>\${customer_name || 'Cliente'}</b>,</p>
                            <p>Hemos recibido tu orden <b>#\${orderId}</b> con éxito.</p>
                            <p>Total de la orden: <b>\${total.toFixed(2)} USD</b></p>
                            <p>Dirección de Envío: \${shipping_address}</p>
                            <p>Método de Pago: \${payment_method}</p>
                            <p>En breve comenzaremos a preparar tu paquete. Te enviaremos otro correo cuando el envío esté en camino.</p>
                            <br>
                            <p>¡Gracias por confiar en PhoneSpot!</p>
                        </div>
                    </div>
                \`;
                sendEmail(customer_email, \`Confirmación de Orden #\${orderId} - PhoneSpot\`, orderHtml);
            }
`;

// Insert it right before res.json({ message: 'Orden creada', orderId });
server = server.replace(/res\.json\(\{ message: 'Orden creada', orderId \}\);/, (match) => {
    return customerEmailInjection + '\n        ' + match;
});

fs.writeFileSync('server.js', server, 'utf8');
console.log('Added customer purchase email');
