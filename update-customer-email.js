const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

const newCustomerEmail = `                let itemsListHtml = '';
                items.forEach(i => {
                    itemsListHtml += '- ' + i.quantity + 'x ' + (i.name || 'Producto') + ' (' + (i.variant_name || 'Sin variante') + ')<br>';
                });

                const orderHtml = '<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">' +
                    '<div style="background: #00a650; color: #fff; padding: 20px; text-align: center;">' +
                        '<h1>¡Compra Confirmada!</h1>' +
                    '</div>' +
                    '<div style="padding: 20px;">' +
                        '<p>Hola <b>' + (customer_name || 'Cliente') + '</b>,</p>' +
                        '<p>Hemos recibido tu orden <b>#' + orderId + '</b> con éxito.</p>' +
                        '<p><b>Resumen de tu compra:</b><br>' + itemsListHtml + '</p>' +
                        '<p>Total de la orden: <b>' + total.toFixed(2) + ' USD</b></p>' +
                        '<p>Dirección de Envío: ' + shipping_address + '</p>' +
                        '<p>Método de Pago: Efectivo / Transferencia</p>' +
                        '<p>Por favor, coordina el pago con nosotros a través de nuestro WhatsApp. Una vez confirmado, comenzaremos a preparar tu paquete.</p>' +
                        '<br>' +
                        '<p>¡Gracias por confiar en PhoneSpot!</p>' +
                    '</div>' +
                '</div>';
                sendEmail(customer_email, 'Confirmación de Orden #' + orderId + ' - PhoneSpot', orderHtml);`;

// Find where to splice
const startIdx = lines.findIndex(l => l.includes('const orderHtml = `'));
if (startIdx !== -1) {
    lines.splice(startIdx, 18, newCustomerEmail); // Removed the old template literal block and sendEmail
    fs.writeFileSync('server.js', lines.join('\n'), 'utf8');
    console.log('Updated customer email logic successfully');
} else {
    console.log('Could not find customer email logic');
}
