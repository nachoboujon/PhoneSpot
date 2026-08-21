const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const emailHelper = `
// Función genérica para enviar emails
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('No email credentials configured, skipping email to:', to);
            return;
        }
        await transporter.sendMail({
            from: \`"PhoneSpot" <\${process.env.EMAIL_USER}>\`,
            to,
            subject,
            html
        });
        console.log('Email sent to', to);
    } catch (err) {
        console.error('Error sending email:', err);
    }
};
`;

if (!server.includes('const sendEmail = async')) {
    server = server.replace(/const authenticate =/, emailHelper + '\nconst authenticate =');
}

// 1. Send email on registration
server = server.replace(/res\.status\(201\)\.json\(\{ message: 'Usuario registrado exitosamente', userId: data\[0\]\.id \}\);/, (match) => {
    return `
        // Enviar email de bienvenida
        const welcomeHtml = \`
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Bienvenido a PhoneSpot, \${name}!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <b>\${name}</b>,</p>
                    <p>Gracias por registrarte en nuestra tienda. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                    <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas en celulares, notebooks y accesorios.</p>
                    <br>
                    <a href="https://phonespot.com.ar/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                    <br><br>
                    <p>¡Saludos!<br>El equipo de PhoneSpot</p>
                </div>
            </div>
        \`;
        sendEmail(email, '¡Bienvenido a PhoneSpot!', welcomeHtml);
        ${match}`;
});


// 2. Send email on purchase
server = server.replace(/res\.status\(201\)\.json\(\{ message: 'Orden procesada', orderId: orderId \}\);/, (match) => {
    return `
            // Enviar email de confirmación de compra
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
            if (customer_email) sendEmail(customer_email, \`Confirmación de Orden #\${orderId}\`, orderHtml);
            
            // También notificar al ADMIN de la nueva venta!
            if (process.env.ADMIN_EMAIL) {
                sendEmail(process.env.ADMIN_EMAIL, \`NUEVA VENTA! Orden #\${orderId}\`, \`<p>El cliente \${customer_name || 'Cliente'} ha realizado una nueva compra. Revisa el panel de administrador.</p>\`);
            }
            
            ${match}`;
});

// 3. Status update email (shipped/completed)
// Line 501 is app.put('/api/orders/:id/status'
server = server.replace(/if \(error\) throw error;\s*res\.json\(\{ message: 'Estado actualizado' \}\);/, (match) => {
    return `if (error) throw error;
        
        // Fetch order details to get customer email
        const { data: orderDetails } = await supabase.from('orders').select('user_id').eq('id', id).single();
        if (orderDetails && orderDetails.user_id) {
            const { data: userData } = await supabase.from('users').select('email, name').eq('id', orderDetails.user_id).single();
            if (userData && userData.email) {
                let statusMessage = '';
                if (status === 'shipped') statusMessage = 'Tu pedido ha sido despachado y está en camino.';
                if (status === 'completed') statusMessage = 'Tu pedido ha sido marcado como entregado. ¡Que lo disfrutes!';
                
                if (statusMessage) {
                    sendEmail(userData.email, \`Actualización de tu pedido #\${id}\`, \`
                        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2 style="color: #111;">Hola \${userData.name},</h2>
                            <p>\${statusMessage}</p>
                            <p>¡Gracias por elegir PhoneSpot!</p>
                        </div>
                    \`);
                }
            }
        }
        
        res.json({ message: 'Estado actualizado' });`;
});

// 4. Marketing Email endpoint for Offers
const marketingEndpoint = `
// --- MARKETING ENDPOINT ---
app.post('/api/marketing/offers', authenticate, isAdmin, async (req, res) => {
    try {
        const { subject, message, link } = req.body;
        
        // Obtener todos los usuarios registrados
        const { data: users, error } = await supabase.from('users').select('email, name');
        if (error) throw error;
        
        const marketingHtml = \`
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #e74c3c; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Nueva Oferta Exclusiva!</h1>
                </div>
                <div style="padding: 20px; font-size: 16px;">
                    \${message}
                    <br><br>
                    <div style="text-align: center;">
                        <a href="\${link || 'https://phonespot.com.ar/catalogo.html'}" style="display: inline-block; background: #111; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Ver Oferta</a>
                    </div>
                    <br><br>
                    <p style="font-size: 12px; color: #888;">Recibes este correo porque te registraste en PhoneSpot.ar</p>
                </div>
            </div>
        \`;
        
        // Send email to all users
        for (let user of users) {
            sendEmail(user.email, subject || '¡Descubre nuestras nuevas ofertas en PhoneSpot!', marketingHtml);
        }
        
        res.json({ message: \`Correos de marketing enviados a \${users.length} usuarios.\` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error enviando marketing' });
    }
});
`;

if (!server.includes('/api/marketing/offers')) {
    server = server.replace(/app\.listen\(/, marketingEndpoint + '\napp.listen(');
}

fs.writeFileSync('server.js', server, 'utf8');
console.log('Injected comprehensive email marketing and transactional logic');
