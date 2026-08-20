const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const ogRoute = `
// Interceptar producto.html para inyectar Meta Tags (SEO/WhatsApp)
app.get('/producto.html', async (req, res, next) => {
    const id = req.query.id;
    if (!id) return next();
    
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error || !data) return next();
        
        let html = fs.readFileSync(path.join(__dirname, 'public', 'producto.html'), 'utf8');
        
        const imageUrl = data.image_url.startsWith('http') ? data.image_url : 'http://' + req.get('host') + data.image_url;
        
        const metaTags = \`
            <meta property="og:title" content="\${data.name} | PhoneSpot">
            <meta property="og:description" content="Mira este equipo increíble disponible en PhoneSpot.">
            <meta property="og:image" content="\${imageUrl}">
            <meta name="twitter:card" content="summary_large_image">
        \`;
        
        html = html.replace('</head>', metaTags + '</head>');
        res.send(html);
    } catch(e) {
        next();
    }
});
`;

// Insert before app.use(express.static('public'));
s = s.replace("app.use(express.static('public'));", ogRoute + "\napp.use(express.static('public'));");
fs.writeFileSync('server.js', s, 'utf8');
console.log('Added SEO route');
