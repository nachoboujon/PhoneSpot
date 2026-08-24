const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const newEndpoints = `
// --- RUTAS DE SETTINGS Y UPLOADS PERSISTENTES (SUPABASE) ---
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase.storage.from('uploads').download('settings.json');
        if (error || !data) {
            return res.json({ top_banner: "Lanzamiento...", carousel: [] });
        }
        const text = await data.text();
        res.json(JSON.parse(text));
    } catch (err) {
        res.status(500).json({ error: 'Error leyendo settings' });
    }
});

app.post('/api/upload', authenticate, isAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió imagen' });
    
    try {
        const ext = req.file.originalname.split('.').pop();
        const fileName = \`img_\${Date.now()}.\${ext}\`;
        
        // Subir a Supabase Storage (persistente)
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });
            
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        res.json({ url: publicUrlData.publicUrl });
        
    } catch(err) {
        console.error('Error subiendo a Supabase:', err);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

app.post('/api/settings', authenticate, isAdmin, async (req, res) => {
    try {
        const settingsJson = JSON.stringify(req.body, null, 2);
        
        // Subir a Supabase Storage
        const { error } = await supabase.storage
            .from('uploads')
            .upload('settings.json', settingsJson, {
                contentType: 'application/json',
                upsert: true
            });
            
        if (error) throw error;
        res.json({ message: 'Ajustes guardados correctamente en la nube' });
    } catch (err) {
        console.error('Error guardando settings en Supabase:', err);
        res.status(500).json({ error: 'Error guardando settings' });
    }
});
`;

// Replace the old endpoints
const oldBlockStart = server.indexOf('// --- RUTAS DE SETTINGS ---');
const oldBlockEnd = server.indexOf('// MERCADO PAGO INTEGRATION');

if (oldBlockStart > -1 && oldBlockEnd > -1) {
    server = server.substring(0, oldBlockStart) + newEndpoints + '\n\n' + server.substring(oldBlockEnd);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Server endpoints successfully updated to use Supabase Storage');
} else {
    console.log('Could not find old block bounds');
}
