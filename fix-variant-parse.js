const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const oldGetAll = `app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

const newGetAll = `app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
        if (error) throw error;
        
        // Parse variants string if needed
        data.forEach(p => {
            if (p.variants && typeof p.variants === 'string') {
                try { p.variants = JSON.parse(p.variants); } catch(e) { p.variants = []; }
            }
        });
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

const oldGetOne = `app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

const newGetOne = `app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
        
        if (data.variants && typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch(e) { data.variants = []; }
        }
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

if(s.includes(oldGetAll) && s.includes(oldGetOne)) {
    s = s.replace(oldGetAll, newGetAll).replace(oldGetOne, newGetOne);
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Fixed variants string issue in server.js');
} else {
    console.log('Not found endpoints to replace in server.js');
}
