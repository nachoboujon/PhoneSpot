const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

// Insert the Zipnova shipping quote endpoint
const quoteEndpoint = `
// ==================== SHIPPING ZIPNOVA API ====================
app.post('/api/shipping/quote', async (req, res) => {
    try {
        const { zip_code, total_amount, items } = req.body;
        
        // Aquí iría el código oficial de Zipnova cuando tengamos API Key + API Secret completos.
        // Simulamos la respuesta de Zipnova (Zippin) con tarifas calculadas por Código Postal
        
        let isLocal = (zip_code === '3280' || zip_code === '3283');
        
        if (isLocal) {
            return res.json({
                success: true,
                options: [
                    { id: 'local', name: 'Envío Local (Cadetería)', cost: 0, time: '24hs' }
                ]
            });
        }
        
        // Base costs depending on region (fake logic for now)
        let baseCost = 8500;
        if (zip_code && zip_code.startsWith('9')) baseCost = 15000; // Patagonia
        else if (zip_code && (zip_code.startsWith('4') || zip_code.startsWith('5'))) baseCost = 11000; // Norte / Cuyo
        
        res.json({
            success: true,
            options: [
                { id: 'correo_sucursal', name: 'Correo Argentino (A Sucursal)', cost: Math.max(0, baseCost - 2000), time: '3-6 días' },
                { id: 'correo_domicilio', name: 'Correo Argentino (A Domicilio)', cost: baseCost, time: '3-6 días' },
                { id: 'andreani_sucursal', name: 'Andreani (A Sucursal)', cost: baseCost + 1500, time: '2-4 días' },
                { id: 'andreani_domicilio', name: 'Andreani (A Domicilio)', cost: baseCost + 3500, time: '2-4 días' }
            ]
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Error cotizando envío' });
    }
});
`;

if (!server.includes('/api/shipping/quote')) {
    server = server.replace(/app\.listen\(/, quoteEndpoint + '\napp.listen(');
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('Added shipping endpoint to server.js');
}
