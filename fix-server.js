const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const lines = s.split('\n');
let newLines = [];
let inOrdersRoute = false;
let openBraces = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("app.post('/api/orders'")) {
        inOrdersRoute = true;
        openBraces = 0;
        
        newLines.push(`app.post('/api/orders', async (req, res) => {
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
        
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ user_id, total, shipping_address }])
            .select();
            
        if (orderError) throw orderError;
        const orderId = orderData[0].id;
        
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

        res.json({ message: 'Orden creada', orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MIS ORDENES
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

// ACTUALIZAR ESTADO ORDEN
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
`);
    }
    
    if (inOrdersRoute) {
        const line = lines[i];
        openBraces += (line.match(/\{/g) || []).length;
        openBraces -= (line.match(/\}/g) || []).length;
        if (openBraces === 0) {
            inOrdersRoute = false;
        }
        continue;
    }
    
    newLines.push(lines[i]);
}

fs.writeFileSync('server.js', newLines.join('\n'), 'utf8');
