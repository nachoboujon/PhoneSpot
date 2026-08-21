const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const updateRoute = `
app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, price, variants } = req.body;
        
        let updateData = {};
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (variants !== undefined) updateData.variants = typeof variants === 'string' ? variants : JSON.stringify(variants);
        
        const { error } = await supabase.from('products').update(updateData).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
`;

if (!s.includes('app.put(\'/api/products/:id\',')) {
    s = s.replace(/app\.put\('\/api\/products\/:id\/stock'[\s\S]+?\}\);/, updateRoute);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Updated product update endpoint in server.js');
}
