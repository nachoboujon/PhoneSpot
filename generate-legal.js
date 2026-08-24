const fs = require('fs');

// 1. Generate Garantias (Warranty Policy)
const garantiasHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Garantías | PhoneSpot</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" href="uploads/PhoneSpot-trans.png">
</head>
<body>
    <!-- Encabezado genérico -->
    <header style="background: var(--bg-color); border-bottom: 1px solid var(--border-color);">
        <div class="logo">
            <h1><a href="index.html" style="display:flex; align-items:center; gap:0.5rem;"><img src="uploads/PhoneSpot-trans.png" alt="PhoneSpot Logo" style="height:35px; width:auto; border-radius: 4px;"> PhoneSpot.</a></h1>
        </div>
        <div class="menu-toggle" id="mobile-menu-btn"><i class="fa-solid fa-bars"></i></div>
        <nav>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="catalogo.html?cat=all">Productos</a></li>
            </ul>
        </nav>
        <div class="header-icons">
            <a href="login.html" title="Mi Cuenta"><i class="fa-solid fa-user"></i></a>
            <a href="carrito.html" class="cart-icon"><i class="fa-solid fa-cart-shopping"></i></a>
        </div>
    </header>

    <main style="padding: 4rem 5%; max-width: 900px; margin: 0 auto; line-height: 1.6; color: var(--text-color);">
        <h1 style="font-size: 2.5rem; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem;">Política de Garantía</h1>
        
        <h3 style="margin-top: 2rem; font-size: 1.5rem;">1. Cobertura de Equipos Nuevos</h3>
        <p>Todos nuestros equipos nuevos cuentan con una garantía oficial de <strong>12 meses (1 año)</strong> desde la fecha de facturación. Esta garantía cubre exclusivamente defectos de fabricación y fallas en el hardware que no sean atribuibles al mal uso por parte del usuario.</p>
        
        <h3 style="margin-top: 2rem; font-size: 1.5rem;">2. Cobertura de Equipos "Swap Americano" / Seminuevos</h3>
        <p>Los equipos categorizados como "Swap Americano" cuentan con una garantía de <strong>3 a 6 meses</strong> (dependiendo del modelo especificado en la factura). Garantizamos que el equipo es 100% funcional y original.</p>

        <h3 style="margin-top: 2rem; font-size: 1.5rem;">3. ¿Qué invalida la garantía?</h3>
        <ul style="margin-left: 2rem; margin-top: 1rem; list-style-type: disc;">
            <li>Daños físicos (pantallas rotas, abolladuras, raspones profundos).</li>
            <li>Contacto con líquidos o humedad (incluso en equipos con certificación IP68, ya que las marcas oficiales no lo cubren).</li>
            <li>Modificaciones de software no oficiales (Jailbreak, Root, flasheos de ROM).</li>
            <li>Intervención técnica por parte de terceros no autorizados por PhoneSpot.</li>
            <li>Variaciones de tensión eléctrica o uso de cargadores no homologados.</li>
        </ul>

        <h3 style="margin-top: 2rem; font-size: 1.5rem;">4. Proceso de Reclamo</h3>
        <p>Para hacer efectiva la garantía, el cliente debe contactarnos a través de nuestro canal oficial de soporte presentando:</p>
        <ol style="margin-left: 2rem; margin-top: 1rem;">
            <li>El comprobante de compra (Factura o Recibo Electrónico).</li>
            <li>El equipo en su caja original con todos sus accesorios.</li>
            <li>El equipo no debe tener cuentas vinculadas (iCloud, Google) al momento de ser entregado.</li>
        </ol>

        <p style="margin-top: 3rem; font-size: 0.9rem; color: #666;">Última actualización: Agosto 2026</p>
    </main>

    <script src="script.js"></script>
</body>
</html>`;

// 2. Generate Terminos (Terms and Conditions)
const terminosHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Términos y Condiciones | PhoneSpot</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" href="uploads/PhoneSpot-trans.png">
</head>
<body>
    <header style="background: var(--bg-color); border-bottom: 1px solid var(--border-color);">
        <div class="logo">
            <h1><a href="index.html" style="display:flex; align-items:center; gap:0.5rem;"><img src="uploads/PhoneSpot-trans.png" alt="PhoneSpot Logo" style="height:35px; width:auto; border-radius: 4px;"> PhoneSpot.</a></h1>
        </div>
        <div class="menu-toggle" id="mobile-menu-btn"><i class="fa-solid fa-bars"></i></div>
        <nav>
            <ul>
                <li><a href="index.html">Inicio</a></li>
                <li><a href="catalogo.html?cat=all">Productos</a></li>
            </ul>
        </nav>
        <div class="header-icons">
            <a href="login.html" title="Mi Cuenta"><i class="fa-solid fa-user"></i></a>
            <a href="carrito.html" class="cart-icon"><i class="fa-solid fa-cart-shopping"></i></a>
        </div>
    </header>

    <main style="padding: 4rem 5%; max-width: 900px; margin: 0 auto; line-height: 1.6; color: var(--text-color);">
        <h1 style="font-size: 2.5rem; margin-bottom: 2rem; border-bottom: 2px solid #000; padding-bottom: 1rem;">Términos y Condiciones</h1>
        
        <h3 style="margin-top: 2rem; font-size: 1.5rem;">1. Aceptación de los Términos</h3>
        <p>Al acceder y utilizar el sitio web de PhoneSpot, usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio ni realizar compras.</p>
        
        <h3 style="margin-top: 2rem; font-size: 1.5rem;">2. Envíos y Entregas</h3>
        <p>Los plazos de entrega indicados son estimativos. PhoneSpot utiliza servicios logísticos de terceros (como Correo Argentino, Andreani o cadetería privada). No nos hacemos responsables por demoras ocasionadas por las empresas de transporte, aunque brindaremos toda la asistencia posible para el rastreo del paquete.</p>

        <h3 style="margin-top: 2rem; font-size: 1.5rem;">3. Política de Devoluciones (Arrepentimiento)</h3>
        <p>Conforme a la Ley de Defensa del Consumidor en Argentina (Ley 24.240), los clientes tienen el derecho de revocar la aceptación del producto dentro de los <strong>10 días corridos</strong> computados a partir de la recepción del bien, sin responsabilidad alguna.</p>
        <p><strong>Condiciones:</strong> El producto debe ser devuelto exactamente en las mismas condiciones en las que fue entregado, sin uso, en su empaque original sellado, y con todos sus accesorios intactos.</p>

        <h3 style="margin-top: 2rem; font-size: 1.5rem;">4. Pagos y Facturación</h3>
        <p>Las transacciones realizadas mediante tarjetas de crédito o débito son procesadas de forma segura a través de pasarelas de pago externas (Mercado Pago). PhoneSpot no almacena información de tarjetas de crédito.</p>

        <p style="margin-top: 3rem; font-size: 0.9rem; color: #666;">Última actualización: Agosto 2026</p>
    </main>

    <script src="script.js"></script>
</body>
</html>`;

fs.writeFileSync('public/garantias.html', garantiasHtml, 'utf8');
fs.writeFileSync('public/terminos.html', terminosHtml, 'utf8');
console.log('Legal pages generated');

// 3. Clean up the Footer across all HTML files
const files = [
    'public/index.html', 'public/catalogo.html', 'public/producto.html', 
    'public/carrito.html', 'public/checkout.html', 'public/perfil.html', 
    'public/login.html', 'public/register.html', 'public/admin.html', 
    'public/garantias.html', 'public/terminos.html'
];

files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            let html = fs.readFileSync(file, 'utf8');
            
            // Reemplazar los iconos sociales genéricos por solo Instagram
            const oldSocialsRegex = /<div class="social-icons"[\s\S]*?<\/div>/;
            const newSocials = `<div class="social-icons" style="display: flex; gap: 15px; font-size: 1.5rem; justify-content: center;">
                    <a href="https://instagram.com/TU_USUARIO" id="instagram-link" target="_blank" style="color: var(--text-color); transition: 0.3s;"><i class="fa-brands fa-instagram"></i></a>
                </div>`;
            
            if (oldSocialsRegex.test(html)) {
                html = html.replace(oldSocialsRegex, newSocials);
                fs.writeFileSync(file, html, 'utf8');
            }
        }
    } catch(e) { console.error(e); }
});
console.log('Footers updated to only include Instagram');
