const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

const newEmailLogic = `        try {
            let itemsList = '';
            items.forEach(i => {
                itemsList += '- ' + i.quantity + 'x ' + (i.name || 'Producto') + ' (' + (i.variant_name || 'Sin variante') + ')\\n';
            });

            const htmlContent = '<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">' +
                '<div style="background: #111; padding: 20px; text-align: center;">' +
                    '<h1 style="color: white; margin: 0;">¡Nueva Venta en PhoneSpot! 🎉</h1>' +
                '</div>' +
                '<div style="padding: 20px; font-size: 16px;">' +
                    '<p><strong>Orden #' + orderId + '</strong></p>' +
                    '<p><strong>Detalles del cliente:</strong><br>' +
                    'Nombre: ' + customer_name + '<br>' +
                    'Email: ' + customer_email + '<br>' +
                    'Dirección: ' + shipping_address + '<br>' +
                    'Método de pago: ' + payment_method + '<br>' +
                    'Total de la orden: ' + total.toFixed(2) + ' USD</p>' +
                    '<p><strong>Productos comprados:</strong><br>' +
                    itemsList.replace(/\\n/g, '<br>') + '</p>' +
                    '<p style="font-size: 12px; color: #888; margin-top: 20px;">Revisa tu panel de administrador para más detalles.</p>' +
                '</div>' +
            '</div>';

            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (adminEmail) {
                await sendEmail(adminEmail, '🎉 ¡Nueva Venta en PhoneSpot! - Orden #' + orderId, htmlContent);
                console.log('Email de notificación enviado al admin vía Brevo.');
            }
        } catch (mailErr) {
            console.error('Error enviando email:', mailErr);
        }`;

lines.splice(715, 31, newEmailLogic);

fs.writeFileSync('server.js', lines.join('\n'), 'utf8');
console.log('Spliced Brevo email logic correctly');
