const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

// Fix the GET /api/products endpoint
const getEndpointRegex = /app\.get\('\/api\/products', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);/;
const getNew = `app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        data.forEach(prod => {
            if (prod.variants) {
                while (typeof prod.variants === 'string') {
                    try { prod.variants = JSON.parse(prod.variants); }
                    catch(e) { break; }
                }
                if (!Array.isArray(prod.variants)) prod.variants = [];
            }
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

if(s.match(getEndpointRegex)) {
    s = s.replace(getEndpointRegex, getNew);
}

// Fix the GET /api/products/:id endpoint
const getIdRegex = /app\.get\('\/api\/products\/:id', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);/;
const getIdNew = `app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
        
        if (data.variants) {
            while (typeof data.variants === 'string') {
                try { data.variants = JSON.parse(data.variants); }
                catch(e) { break; }
            }
            if (!Array.isArray(data.variants)) data.variants = [];
        }

        res.json(data);
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

if(s.match(getIdRegex)) {
    s = s.replace(getIdRegex, getIdNew);
}

fs.writeFileSync('server.js', s, 'utf8');
console.log('Fixed GET variants parsing!');
