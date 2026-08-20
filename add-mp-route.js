const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

// Insert the Mercado Pago route
const mpRoute = `
// MERCADO PAGO INTEGRATION
app.post('/api/mercadopago/preference', async (req, res) => {
    try {
        const { items, customer_email, total_ars } = req.body;
        
        const mpAccessToken = process.env.MP_ACCESS_TOKEN;
        if (!mpAccessToken) {
            return res.status(400).json({ error: 'Mercado Pago no configurado en el servidor' });
        }
        
        const preference = {
            items: [
                {
                    title: 'Compra en PhoneSpot',
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: total_ars
                }
            ],
            payer: { email: customer_email },
            back_urls: {
                success: 'http://localhost:3000/perfil.html',
                failure: 'http://localhost:3000/carrito.html',
                pending: 'http://localhost:3000/perfil.html'
            },
            auto_return: 'approved'
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${mpAccessToken}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });
        
        const data = await response.json();
        if (data.init_point) {
            res.json({ init_point: data.init_point });
        } else {
            res.status(500).json({ error: 'Error de MercadoPago', details: data });
        }
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Error procesando Mercado Pago' });
    }
});
`;

if (!s.includes('/api/mercadopago/preference')) {
    s = s.replace('// --- RUTAS DE ORDENES ---', mpRoute + '\n// --- RUTAS DE ORDENES ---');
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Added MP to server.js');
}
