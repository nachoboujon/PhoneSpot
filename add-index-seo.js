const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

if (!html.includes('og:title')) {
    const metaTags = `
    <meta property="og:title" content="PhoneSpot | Tu tienda de tecnología">
    <meta property="og:description" content="Los mejores celulares, notebooks y accesorios al mejor precio, actualizados al dólar blue. ¡Envíos a todo el país!">
    <meta property="og:image" content="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    `;
    html = html.replace('</head>', metaTags + '</head>');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log('Added OG tags to index.html');
}
