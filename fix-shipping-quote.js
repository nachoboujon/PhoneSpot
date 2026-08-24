const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

const oldQuoteBlock = /app\.post\('\/api\/shipping\/quote'[\s\S]*?res\.status\(500\)\.json\(\{ success: false, error: 'Error cotizando envío' \}\);\s*\}/;

const newQuoteBlock = `app.post('/api/shipping/quote', async (req, res) => {
    try {
        const { zip_code, total_amount, items } = req.body;
        
        let isLocal = (zip_code === '3280' || zip_code === '3283' || zip_code === '3265' || zip_code === '3260');
        
        if (isLocal) {
            return res.json({
                success: true,
                options: [
                    { id: 'local', name: 'Envío Local (Cadetería)', cost: 0, time: '24hs' }
                ]
            });
        }
        
        // Fetch current settings from Supabase to use the admin's exact custom prices
        let adminSettings = { shipping_correo: 8500, shipping_andreani: 12000 };
        try {
            const { data } = await supabase.storage.from('uploads').download('settings.json');
            if (data) {
                const text = await data.text();
                adminSettings = JSON.parse(text);
            }
        } catch(e) {}
        
        // Calculadora de Zonas Interna (Reemplazo Inteligente de Zipnova)
        let modifier = 1.0;
        if (zip_code && zip_code.startsWith('9')) modifier = 1.6; // Patagonia (60% más caro)
        else if (zip_code && (zip_code.startsWith('4') || zip_code.startsWith('5'))) modifier = 1.3; // Norte/Cuyo (30% más)
        
        const costCorreo = Math.round((adminSettings.shipping_correo || 8500) * modifier);
        const costAndreani = Math.round((adminSettings.shipping_andreani || 12000) * modifier);
        
        res.json({
            success: true,
            options: [
                { id: 'correo_sucursal', name: 'Correo Argentino (A Sucursal)', cost: Math.max(0, costCorreo - 2000), time: '3-6 días' },
                { id: 'correo_domicilio', name: 'Correo Argentino (A Domicilio)', cost: costCorreo, time: '3-6 días' },
                { id: 'andreani_sucursal', name: 'Andreani (A Sucursal)', cost: Math.max(0, costAndreani - 3000), time: '2-4 días' },
                { id: 'andreani_domicilio', name: 'Andreani (A Domicilio)', cost: costAndreani, time: '2-4 días' }
            ]
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Error cotizando envío' });
    }`;

if (oldQuoteBlock.test(server)) {
    server = server.replace(oldQuoteBlock, newQuoteBlock);
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Fixed shipping quote to use admin panel settings dynamically!');
} else {
    console.log('Regex failed');
}
