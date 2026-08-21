const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regexPut = /app\.put\('\/api\/products\/:id', authenticate, isAdmin, async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);/;

const newPut = `app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, price, variants } = req.body;
        
        let updateData = {};
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (price !== undefined) updateData.price = parseFloat(price);
        
        if (variants !== undefined) {
            if (typeof variants === 'string') {
                try {
                    updateData.variants = JSON.parse(variants);
                } catch(e) {
                    updateData.variants = [];
                }
            } else {
                updateData.variants = variants;
            }
        }
        
        const { error } = await supabase.from('products').update(updateData).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error PUT product:', error);
        res.status(500).json({ error: error.message });
    }
});`;

if(s.match(regexPut)) {
    s = s.replace(regexPut, newPut);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Fixed PUT endpoint');
} else {
    console.log('Could not match PUT endpoint');
}
