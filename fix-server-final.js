const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const startIndex = s.indexOf('// --- RUTAS DE ORDENES ---');
const endIndex = s.indexOf('app.get(\'/api/orders\'');

if (startIndex !== -1 && endIndex !== -1) {
    const before = s.substring(0, startIndex);
    const after = s.substring(endIndex);

    const newRoutes = \// --- RUTAS DE ORDENES ---
app.post('/api/orders', async (req, res) => {
    try {
        const { items, shipping_address, customer_email, customer_name, payment_method, shipping_cost } = req.body; 
        
        let user_id = null;
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = require('jsonwebtoken');
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
                user_id = verified.id;
            } catch(e) { }
        }

        const extraShipping = Number(shipping_cost) || 0;
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0) + extraShipping;
        
        // Crear orden
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ user_id, total, shipping_address }])
            .select();
            
        if (orderError) throw orderError;
        const orderId = orderData[0].id;
        
        // Insertar items y descontar stock
        for (const item of items) {
            if(item.product_id) {
                await supabase.from('order_items').insert([{
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    variant_name: item.variant_name || null
                }]);

                const { data: prodData } = await supabase.from('products').select('stock, variants').eq('id', item.product_id).single();
                if (prodData) {
                    let newStock = prodData.stock - item.quantity;
                    newStock = newStock < 0 ? 0 : newStock;
                    
                    let newVariants = prodData.variants;
                    if (newVariants && item.variant_name) {
                        newVariants = newVariants.map(v => {
                            const vName = [v.color, v.capacity, v.ram].filter(Boolean).join(' - ');
                            if (vName === item.variant_name && v.stock > 0) v.stock -= item.quantity;
                            return v;
                        });
                    }
                    await supabase.from('products').update({ stock: newStock, variants: newVariants }).eq('id', item.product_id);
                }
            }
        }

        // Correo al admin
        if(process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: \Nueva Orden #\\,
                text: \Total: $\\\nMétodo: \\
            }, () => {});
        }

        // ==========================================
        // INTEGRACIÓN MERCADO PAGO
        // ==========================================
        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
        if (payment_method === 'mercadopago') {
            if (!MP_ACCESS_TOKEN) {
                return res.status(200).json({ message: 'Orden creada, pero falta configurar Mercado Pago.', orderId });
            }

            const mpItems = items.map(item => ({
                title: \Producto PhoneSpot \\,
                unit_price: Number(item.price),
                quantity: Number(item.quantity),
                currency_id: 'ARS'
            }));

            if (extraShipping > 0) {
                mpItems.push({
                    title: 'Costo de Envío',
                    unit_price: extraShipping,
                    quantity: 1,
                    currency_id: 'ARS'
                });
            }

            const preferenceData = {
                items: mpItems,
                payer: { name: customer_name, email: customer_email },
                back_urls: {
                    success: 'http://localhost:3000/compra-exitosa.html',
                    failure: 'http://localhost:3000/index.html?pago=error',
                    pending: 'http://localhost:3000/index.html?pago=pendiente'
                },
                auto_return: 'approved'
            };

            const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': \Bearer \\,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferenceData)
            });

            const mpData = await mpResponse.json();
            if (mpResponse.ok && mpData.init_point) {
                return res.status(200).json({ init_point: mpData.init_point });
            } else {
                return res.status(400).json({ error: 'Error al generar link de Mercado Pago' });
            }
        }

        res.json({ message: 'Orden creada', orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener mis ordenes (Cliente)
app.get('/api/my-orders', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, image_url))')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar estado y tracking (Admin)
app.put('/api/orders/:id/status', authenticate, isAdmin, async (req, res) => {
    try {
        const { status, tracking_code } = req.body;
        const { data, error } = await supabase
            .from('orders')
            .update({ status, tracking_code })
            .eq('id', req.params.id)
            .select();
        if (error) throw error;
        res.json({ message: 'Orden actualizada', order: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE RESEÑAS ---
app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const { error } = await supabase.from('reviews').insert([{
            product_id,
            user_name: req.user.name,
            rating,
            comment
        }]);
        if (error) throw error;
        res.json({ message: 'Reseña guardada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/:product_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('product_id', req.params.product_id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

\;

    fs.writeFileSync('server.js', before + newRoutes + after, 'utf8');
}
