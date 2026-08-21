const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const emailLogic = `
        // =========== ENVÍO DE EMAIL AL DUEÑO ===========
        try {
            const nodemailer = require('nodemailer');
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                let itemsList = '';
                items.forEach(i => {
                    itemsList += \`- \${i.quantity}x \${i.name || 'Producto'} (\${i.variant_name || 'Sin variante'})\\n\`;
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                    subject: \`🎉 ¡Nueva Venta en PhoneSpot! - Orden #\${orderId}\`,
                    text: \`¡Hola! Alguien acaba de realizar una compra.\\n\\nDetalles del cliente:\\nNombre: \${customer_name}\\nEmail: \${customer_email}\\nDirección: \${shipping_address}\\nMétodo de pago: \${payment_method}\\nTotal de la orden: \${total.toFixed(2)} USD\\n\\nProductos comprados:\\n\${itemsList}\\n\\nRevisa el panel de control o tu base de datos para gestionar el envío.\`
                };

                await transporter.sendMail(mailOptions);
                console.log('Email de notificación enviado al admin.');
            } else {
                console.log('No se envió email porque falta configurar EMAIL_USER y EMAIL_PASS en el .env');
            }
        } catch (mailErr) {
            console.error('Error enviando email:', mailErr);
        }
        // ===============================================

        res.json({ message: 'Orden creada', orderId });`;

if (!s.includes('ENVÍO DE EMAIL AL DUEÑO')) {
    s = s.replace(/res\.json\(\{ message: 'Orden creada', orderId \}\);/g, emailLogic);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Added email notification logic to server.js');
} else {
    console.log('Email logic already exists');
}
