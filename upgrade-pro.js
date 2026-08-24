const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// 1. Upgrade Email Template
const oldEmailTemplateRegex = /const verifyHtml = `[\s\S]*?`;/;
const newEmailTemplate = `const verifyHtml = \`
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
                <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
                    <img src="https://phonespot.site/uploads/PhoneSpot-trans.png" alt="PhoneSpot" style="height: 50px; margin-bottom: 20px;">
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Bienvenido a PhoneSpot</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 10px;">Hola <strong style="color: #000;">\${name}</strong>,</p>
                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px;">Estamos encantados de tenerte. Para garantizar la seguridad de tu cuenta y activar tus beneficios, necesitamos verificar tu dirección de correo electrónico.</p>
                    
                    <a href="\${verifyLink}" style="display: inline-block; background-color: #0071e3; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);">Verificar mi Cuenta</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        <p style="font-size: 12px; color: #999999; line-height: 1.5; margin: 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="color:#0071e3">\${verifyLink}</span></p>
                        <p style="font-size: 12px; color: #999999; margin-top: 15px;">Si tú no solicitaste este registro, puedes ignorar o eliminar este correo de forma segura. El enlace expirará automáticamente en 24 horas.</p>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #888888; margin: 0;">© 2026 PhoneSpot. Todos los derechos reservados.</p>
                </div>
            </div>
        \`;`;

if (oldEmailTemplateRegex.test(server)) {
    server = server.replace(oldEmailTemplateRegex, newEmailTemplate);
}

// 2. Add MP Webhook integration to /api/checkout
const preferenceDataRegex = /const preferenceData = \{[\s\S]*?auto_return: 'approved'\n\s*\};/;
const newPreferenceData = `const preferenceData = {
                items: mpItems,
                payer: { name: customer_name, email: customer_email },
                back_urls: {
                    success: req.headers.origin + '/perfil.html?pago=exito',
                    failure: req.headers.origin + '/carrito.html?pago=error',
                    pending: req.headers.origin + '/perfil.html?pago=pendiente'
                },
                auto_return: 'approved',
                external_reference: orderId.toString(),
                notification_url: 'https://phonespot.site/api/mercadopago/webhook'
            };`;

if (preferenceDataRegex.test(server)) {
    server = server.replace(preferenceDataRegex, newPreferenceData);
}

// 3. Add the actual Webhook Endpoint
const webhookEndpoint = `
// ==================== MERCADO PAGO WEBHOOK ====================
app.post('/api/mercadopago/webhook', async (req, res) => {
    try {
        const { query, body } = req;
        const topic = query.topic || body.type;
        const id = query.id || body.data?.id;
        
        if (topic === 'payment' && id) {
            // Verificar estado del pago con Mercado Pago
            const mpResponse = await fetch(\`https://api.mercadopago.com/v1/payments/\${id}\`, {
                headers: { 'Authorization': \`Bearer \${process.env.MP_ACCESS_TOKEN}\` }
            });
            const paymentInfo = await mpResponse.json();
            
            if (paymentInfo.status === 'approved') {
                const orderId = paymentInfo.external_reference;
                
                // Actualizar la orden en Supabase a 'pagado'
                const { error } = await supabase
                    .from('orders')
                    .update({ status: 'pagado' })
                    .eq('id', orderId);
                    
                if (error) console.error('Error actualizando orden en webhook:', error);
                else console.log(\`[WEBHOOK] Orden \${orderId} marcada como pagada (MP ID: \${id})\`);
            }
        }
        res.status(200).send('OK');
    } catch(e) {
        console.error('Error procesando webhook MP:', e);
        res.status(500).send('Error');
    }
});
`;

if (!server.includes('/api/mercadopago/webhook')) {
    // Insert before the generic error handler or at bottom before app.listen
    server = server.replace(/app\.listen\(/, webhookEndpoint + '\napp.listen(');
}

fs.writeFileSync('server.js', server, 'utf8');
console.log('Ultra professional upgrades applied to server.js');
