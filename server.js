const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const corsOrigins = new Set(
    String(process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

// El dominio principal es www. La redirección se hace en Railway para no
// depender de reglas DNS/proxy externas y conservar rutas y parámetros.
app.use((req, res, next) => {
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
    const requestHost = (forwardedHost || req.get('host') || '').split(':')[0].toLowerCase();
    if (requestHost === 'phonespot.site') {
        return res.redirect(301, `https://www.phonespot.site${req.originalUrl}`);
    }
    next();
});

app.use((req, res, next) => {
    const forwardedProtocol = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const protocol = forwardedProtocol || req.protocol;
    const sameOrigin = `${protocol}://${req.get('host')}`;

    cors({
        origin(origin, callback) {
            if (!origin || origin === sameOrigin || corsOrigins.has(origin)) return callback(null, true);
            callback(new Error('Origen no permitido por CORS'));
        }
    })(req, res, next);
});
app.use(express.json({ limit: '1mb' }));

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const jwtSecret = process.env.JWT_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const smtpTransport = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    : null;

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const parseVariants = (variants) => {
    let parsed = variants;
    try {
        while (typeof parsed === 'string') parsed = JSON.parse(parsed);
    } catch (_) {
        return [];
    }
    return Array.isArray(parsed) ? parsed : [];
};

const variantNameFor = (variant) => [
    variant.color,
    variant.capacity,
    variant.ram,
    variant.batt ? `Bat: ${variant.batt}` : null
].filter(Boolean).join(' - ');

// Interceptar producto.html para inyectar Meta Tags (SEO/WhatsApp)
app.get('/producto.html', async (req, res, next) => {
    const id = req.query.id;
    if (!id) return next();
    
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error || !data) return next();
        
        let html = fs.readFileSync(path.join(__dirname, 'public', 'producto.html'), 'utf8');
        
        const baseUrl = 'https://www.phonespot.site';
        const imageUrl = new URL(data.image_url || '/uploads/PhoneSpot-trans.png', baseUrl).toString();
        const productUrl = `${baseUrl}/producto.html?id=${encodeURIComponent(data.id)}`;
        const productSchema = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: data.name,
            image: [imageUrl],
            description: String(data.description || '').replace(/^\[Condición:.*?\]\s*/, ''),
            brand: { '@type': 'Brand', name: data.brand || 'PhoneSpot' },
            offers: {
                '@type': 'Offer',
                url: productUrl,
                priceCurrency: 'USD',
                price: Number(data.price || 0).toFixed(2),
                availability: Number(data.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition'
            }
        }).replace(/</g, '\\u003c');
        
        const metaTags = `
            <link rel="canonical" href="${escapeHtml(productUrl)}">
            <meta property="og:title" content="${escapeHtml(data.name)} | PhoneSpot">
            <meta property="og:description" content="${escapeHtml(String(data.description || 'Tecnología disponible en PhoneSpot.').slice(0, 160))}">
            <meta property="og:image" content="${escapeHtml(imageUrl)}">
            <meta property="og:url" content="${escapeHtml(productUrl)}">
            <meta name="twitter:card" content="summary_large_image">
            <script type="application/ld+json">${productSchema}</script>
        `;
        
        html = html.replace('</head>', metaTags + '</head>');
        res.send(html);
    } catch(e) {
        next();
    }
});

app.use(express.static('public'));

// Crear carpeta uploads si no existe
const uploadDir = path.join(__dirname, 'public', 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (e) {
    console.log('Read-only file system (Vercel). Uploads directory not created.');
}

// Configuración de multer (motor en memoria para subir a Supabase Storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            return callback(new Error('Solo se permiten imágenes.'));
        }
        callback(null, true);
    }
});

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ ADVERTENCIA: SUPABASE_URL y SUPABASE_KEY no están configurados en las variables de entorno. La base de datos no funcionará.');
}

app.get('/sitemap.xml', async (_req, res) => {
    const baseUrl = 'https://www.phonespot.site';
    const fixedPages = ['/', '/catalogo.html', '/garantias.html', '/terminos.html'];
    try {
        const { data: products, error } = await supabase.from('products').select('id, created_at');
        if (error) throw error;
        const urls = [
            ...fixedPages.map((page) => `<url><loc>${baseUrl}${page}</loc><changefreq>weekly</changefreq><priority>${page === '/' ? '1.0' : '0.8'}</priority></url>`),
            ...(products || []).map((product) => `<url><loc>${baseUrl}/producto.html?id=${encodeURIComponent(product.id)}</loc><lastmod>${new Date(product.created_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
        ].join('');
        res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
    } catch (error) {
        console.error('Error generando sitemap:', error.message);
        res.status(503).type('text/plain').send('Sitemap temporalmente no disponible');
    }
});

// Función genérica para enviar emails
const sendEmail = async (to, subject, html) => {
    try {
        if (resendApiKey) {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + resendApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'PhoneSpot <onboarding@resend.dev>',
                    to: [to],
                    subject,
                    html
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Resend API Error:', data);
                return false;
            }
            console.log('Email sent via Resend API:', data.id);
            return data;
        }

        if (smtpTransport) {
            const result = await smtpTransport.sendMail({
                from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                to,
                subject,
                html
            });
            console.log('Email sent via SMTP:', result.messageId);
            return result;
        }

        console.error('Falta RESEND_API_KEY o la configuración SMTP');
        return false;
    } catch (err) {
        console.error('Error sending email:', err.message);
        return false;
    }
};

const notifyStockAlerts = async (product) => {
    if (!product || Number(product.stock) <= 0) return;
    try {
        const { data: alerts, error } = await supabase
            .from('stock_alerts')
            .select('id, email')
            .eq('product_id', product.id);
        if (error || !alerts?.length) return;

        for (const alert of alerts) {
            const sent = await sendEmail(alert.email, `${product.name} volvió a tener stock`, `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#222;">
                    <h1>¡Volvió a estar disponible!</h1>
                    <p>El producto <strong>${escapeHtml(product.name)}</strong> ya tiene stock en PhoneSpot.</p>
                    <p><a href="https://www.phonespot.site/producto.html?id=${encodeURIComponent(product.id)}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Ver producto</a></p>
                    <p style="color:#666;font-size:13px;">Recibiste este correo porque pediste que te avisemos cuando el producto volviera a estar disponible.</p>
                </div>
            `);
            if (sent) await supabase.from('stock_alerts').delete().eq('id', alert.id);
        }
    } catch (error) {
        console.error('Error enviando alertas de stock:', error);
    }
};

const getStoreSettings = async () => {
    try {
        const { data, error } = await supabase.storage.from('uploads').download('settings.json');
        if (error || !data) return {};
        return JSON.parse(await data.text());
    } catch (_) {
        return {};
    }
};

const authenticate = (req, res, next) => {
    if (!jwtSecret) return res.status(503).json({ error: 'Autenticación no configurada en el servidor' });
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });
    try {
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Se requiere rol de administrador' });
    next();
};

const orderStatusLabels = {
    pending: 'Pedido recibido',
    confirmed: 'Pago confirmado',
    completed: 'Pago confirmado',
    preparing: 'En preparación',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

const sendOrderStatusEmail = async (order) => {
    if (!order?.customer_email) return false;
    const label = orderStatusLabels[order.status] || 'Actualizado';
    const tracking = order.tracking_code
        ? `<p><strong>Código de seguimiento:</strong> ${escapeHtml(order.tracking_code)}</p>`
        : '';
    return sendEmail(order.customer_email, `Tu pedido #${order.id} está ${label.toLowerCase()}`, `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#222;">
            <h1>Actualización de tu pedido</h1>
            <p>Hola ${escapeHtml(order.customer_name || 'cliente')}, tu pedido <strong>#${escapeHtml(order.id)}</strong> ahora está: <strong>${escapeHtml(label)}</strong>.</p>
            ${tracking}
            <p>Podés consultar el detalle desde <a href="https://www.phonespot.site/perfil.html">Mi perfil</a> o escribirnos por WhatsApp si necesitás ayuda.</p>
        </div>
    `);
};

// Métricas anónimas y acotadas: no se almacenan IP, email ni identificadores del visitante.
const analyticsRateBuckets = new Map();
const canRecordEvent = (req) => {
    const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const bucket = analyticsRateBuckets.get(key) || { startedAt: now, count: 0 };
    if (now - bucket.startedAt > 60_000) {
        bucket.startedAt = now;
        bucket.count = 0;
    }
    bucket.count += 1;
    analyticsRateBuckets.set(key, bucket);
    return bucket.count <= 30;
};

// --- RUTAS DE USUARIOS ---

// Diagnósticos disponibles únicamente fuera de producción y para administradores.
if (!isProduction) {
    app.get('/api/version', authenticate, isAdmin, (_req, res) => {
        res.json({ version: '1.1.0', environment: process.env.NODE_ENV || 'development' });
    });
}

app.post('/api/register', async (req, res) => {
    try {
        if (!jwtSecret) return res.status(503).json({ error: 'El registro no está configurado en el servidor' });

        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (name.length < 2 || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            return res.status(400).json({ error: 'Verifica nombre, email y una contraseña de al menos 8 caracteres.' });
        }
        
        // Check if user already exists
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) return res.status(400).json({ error: 'El email ya está registrado' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === String(process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'client';
        
        // Generate verification token (expires in 1 hour)
        const jwt = require('jsonwebtoken');
        const verificationToken = jwt.sign(
            { name, email, password: hashedPassword, role }, 
            jwtSecret,
            { expiresIn: '1h' }
        );
        
        // Create verification link
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const verifyLink = `${protocol}://${host}/api/verify-email?token=${verificationToken}`;
        
        const verifyHtml = `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
                <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
                    <img src="https://phonespot.site/uploads/PhoneSpot-trans.png" alt="PhoneSpot" style="height: 50px; margin-bottom: 20px;">
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Bienvenido a PhoneSpot</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 10px;">Hola <strong style="color: #000;">${escapeHtml(name)}</strong>,</p>
                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px;">Estamos encantados de tenerte. Para garantizar la seguridad de tu cuenta y activar tus beneficios, necesitamos verificar tu dirección de correo electrónico.</p>
                    
                    <a href="${escapeHtml(verifyLink)}" style="display: inline-block; background-color: #0071e3; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);">Verificar mi Cuenta</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        <p style="font-size: 12px; color: #999999; line-height: 1.5; margin: 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="color:#0071e3">${escapeHtml(verifyLink)}</span></p>
                        <p style="font-size: 12px; color: #999999; margin-top: 15px;">Si tú no solicitaste este registro, puedes ignorar o eliminar este correo de forma segura. El enlace expirará automáticamente en 24 horas.</p>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #888888; margin: 0;">© 2026 PhoneSpot. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        
        try {
            const mailInfo = await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
            if (!mailInfo) throw new Error('No se pudo enviar el correo de verificación');
            res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.' });
        } catch(emailErr) {
            res.status(503).json({ error: 'No se pudo enviar el correo de verificación. Inténtalo más tarde o contacta a soporte.' });
        }


    } catch (error) {
        if(error.code === '23505') return res.status(400).json({ error: 'El email ya existe' }); // código postgres para unique violation
        res.status(500).json({ error: error.message });
    }
});


// --- GOOGLE OAUTH LOGIN/REGISTER ---
app.post('/api/auth/google', async (req, res) => {
    try {
        if (!jwtSecret) return res.status(503).json({ error: 'El inicio de sesión no está configurado en el servidor' });
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'Token requerido' });
        
        // Fetch user info from Google
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const googleUser = await googleRes.json();
        
        if (!googleRes.ok || !googleUser.email) {
            return res.status(401).json({ error: 'Token de Google inválido' });
        }
        
        const email = googleUser.email.toLowerCase();
        const name = googleUser.name || email.split('@')[0];
        const role = email === String(process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'client';
        
        // Check if user exists in our DB
        let { data: user, error: searchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
            
        if (!user) {
            // Register new user with random password
            const crypto = require('crypto');
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{ name, email, password: hashedPassword, role }])
                .select()
                .single();
                
            if (insertError) throw insertError;
            user = newUser;
            
            // Send welcome email
            const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                    <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                        <h1>¡Bienvenido a PhoneSpot, ${escapeHtml(name)}!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hola <b>${escapeHtml(name)}</b>,</p>
                        <p>Gracias por registrarte usando Google. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                        <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas en celulares, notebooks y accesorios.</p>
                        <br>
                        <a href="https://phonespot.site/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                        <br><br>
                        <p>¡Saludos!<br>El equipo de PhoneSpot</p>
                    </div>
                </div>
            `;
            try { sendEmail(email, '¡Bienvenido a PhoneSpot!', welcomeHtml); } catch(e){}
        }
        
        // Generate JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, jwtSecret, { expiresIn: '7d' });
        
        res.json({ message: 'Login con Google exitoso', token, role: user.role, name: user.name });
        
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Error interno conectando con Google' });
    }
});


// --- VERIFICACIÓN DE EMAIL (STATELESS) ---
app.get('/api/verify-email', async (req, res) => {
    try {
        if (!jwtSecret) return res.status(503).send('El registro no está configurado en el servidor.');
        const { token } = req.query;
        if (!token) return res.status(400).send('Token inválido o expirado.');
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, jwtSecret);
        
        // Comprobar si ya existe
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', decoded.email).single();
        if (existingUser) {
            return res.redirect('/login.html?verified=already');
        }
        
        // Insertar usuario validado
        const { error: insertError } = await supabase
            .from('users')
            .insert([{ name: decoded.name, email: decoded.email, password: decoded.password, role: decoded.role }]);
            
        if (insertError) throw insertError;
        
        // Enviar correo de Bienvenida real ahora que está verificado
        const welcomeHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Bienvenido a PhoneSpot, ${escapeHtml(decoded.name)}!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <b>${escapeHtml(decoded.name)}</b>,</p>
                    <p>Tu cuenta ha sido verificada exitosamente. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                    <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas.</p>
                    <br>
                    <a href="https://phonespot.site/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                </div>
            </div>
        `;
        try { sendEmail(decoded.email, '¡Bienvenido a PhoneSpot!', welcomeHtml); } catch(e){}
        
        res.redirect('/login.html?verified=true');
    } catch (error) {
        console.error(error);
        res.status(400).send('<h2>El enlace es inválido o ha expirado. Por favor, regístrate de nuevo.</h2>');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        if (!jwtSecret) return res.status(503).json({ error: 'El inicio de sesión no está configurado en el servidor' });
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const user = data;
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
        
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, jwtSecret, { expiresIn: '7d' });
        res.json({ message: 'Login exitoso', token, role: user.role, name: user.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/request-password-reset', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const genericResponse = { message: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.' };
        if (!jwtSecret || !/^\S+@\S+\.\S+$/.test(email)) return res.json(genericResponse);

        const { data: user } = await supabase.from('users').select('id, name, email').eq('email', email).single();
        if (!user) return res.json(genericResponse);

        const resetToken = jwt.sign({ purpose: 'password-reset', userId: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
        const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const resetLink = `${protocol}://${req.get('host')}/restablecer.html?token=${encodeURIComponent(resetToken)}`;
        const sent = await sendEmail(user.email, 'Restablece tu contraseña de PhoneSpot', `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;color:#222;">
                <h1>Restablecer contraseña</h1>
                <p>Hola ${escapeHtml(user.name || '')}, recibimos una solicitud para cambiar tu contraseña.</p>
                <p><a href="${escapeHtml(resetLink)}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Crear nueva contraseña</a></p>
                <p style="color:#666;font-size:13px;">El enlace vence en una hora. Si no solicitaste este cambio, podés ignorar este correo.</p>
            </div>
        `);
        if (!sent) console.error('No se pudo enviar el correo de recuperación para:', user.id);
        res.json(genericResponse);
    } catch (error) {
        console.error('Error solicitando recuperación de contraseña:', error);
        res.json({ message: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        if (!jwtSecret) return res.status(503).json({ error: 'La recuperación de contraseña no está configurada.' });
        const token = String(req.body.token || '');
        const password = String(req.body.password || '');
        if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded.purpose !== 'password-reset' || !decoded.userId || !decoded.email) throw new Error('Token inválido');

        const passwordHash = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('users')
            .update({ password: passwordHash })
            .eq('id', decoded.userId)
            .eq('email', decoded.email)
            .select('id');
        if (error || !data?.length) throw error || new Error('Usuario no encontrado');
        res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
    } catch (error) {
        res.status(400).json({ error: 'El enlace es inválido o venció. Solicitá uno nuevo.' });
    }
});

// --- RUTAS DE PRODUCTOS ---
app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        data.forEach((product) => { product.variants = parseVariants(product.variants); });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
        
        data.variants = parseVariants(data.variants);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/events', async (req, res) => {
    try {
        if (!canRecordEvent(req)) return res.status(429).json({ error: 'Demasiados eventos.' });
        const allowedEvents = new Set(['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'order_created', 'search']);
        const eventType = String(req.body.event_type || '');
        const productId = req.body.product_id == null ? null : Number.parseInt(req.body.product_id, 10);
        const pagePath = String(req.body.page_path || '').slice(0, 180);
        if (!allowedEvents.has(eventType) || (productId !== null && (!Number.isInteger(productId) || productId < 1))) {
            return res.status(400).json({ error: 'Evento inválido.' });
        }
        // Solo se permiten metadatos operativos mínimos, nunca información personal.
        const metadata = eventType === 'search' && typeof req.body.query_length === 'number'
            ? { query_length: Math.max(0, Math.min(100, Math.floor(req.body.query_length))) }
            : {};
        const { error } = await supabase.from('site_events').insert([{
            event_type: eventType,
            product_id: productId,
            page_path: pagePath || null,
            metadata
        }]);
        if (error) throw error;
        res.status(204).end();
    } catch (error) {
        console.error('Error guardando métrica:', error.message);
        res.status(500).json({ error: 'No se pudo registrar la métrica.' });
    }
});

app.post('/api/stock-alerts', async (req, res) => {
    try {
        const productId = Number.parseInt(req.body.product_id, 10);
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!Number.isInteger(productId) || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: 'Verifica el correo para recibir el aviso.' });
        }
        const { data: product, error: productError } = await supabase.from('products').select('id, stock').eq('id', productId).single();
        if (productError || !product) return res.status(404).json({ error: 'Producto no encontrado.' });
        if (Number(product.stock) > 0) return res.status(409).json({ error: 'Este producto ya tiene stock disponible.' });

        const { error } = await supabase.from('stock_alerts').upsert(
            { product_id: productId, email },
            { onConflict: 'product_id,email', ignoreDuplicates: true }
        );
        if (error) throw error;
        res.status(201).json({ message: 'Te avisaremos cuando vuelva a estar disponible.' });
    } catch (error) {
        console.error('Error creando alerta de stock:', error);
        res.status(500).json({ error: 'No pudimos guardar tu aviso. Inténtalo nuevamente.' });
    }
});

app.post('/api/products', authenticate, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, brand, stock, is_offer, category, variants } = req.body;
        const parsedPrice = Number(price);
        const parsedStock = Number.parseInt(stock, 10);
        if (!String(name || '').trim() || !String(brand || '').trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0 || !Number.isInteger(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ error: 'Verifica nombre, marca, precio y stock.' });
        }
        
        let image_url = '';
        if (req.file) {
            const ext = req.file.originalname.split('.').pop();
            const fileName = `prod_${Date.now()}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });
                
            if (uploadError) throw uploadError;
            
            const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
            image_url = publicUrlData.publicUrl;
        }
        
        const parsedVariants = parseVariants(variants);

        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                name: String(name).trim(),
                description: String(description || '').trim(),
                price: parsedPrice,
                brand: String(brand).trim(),
                category: category || 'celulares', 
                stock: parsedStock,
                variants: parsedVariants,
                is_offer: is_offer === 'true', 
                image_url 
            }])
            .select();
            
        if (error) throw error;
        res.status(201).json({ message: 'Producto creado', productId: data[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


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
        const fileName = `img_${Date.now()}.${ext}`;
        
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


// --- RUTAS DE ORDENES ---
app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const rawItems = req.body.items;
        const customerEmail = String(req.body.customer_email || '').trim().toLowerCase();
        const customerName = String(req.body.customer_name || '').trim();
        const customerPhone = String(req.body.customer_phone || '').trim().slice(0, 40);
        const shippingAddress = String(req.body.shipping_address || '').trim();
        const shippingMethod = String(req.body.shipping_method || 'A coordinar').trim().slice(0, 100);
        const paymentMethod = String(req.body.payment_method || 'transferencia').trim().slice(0, 40);
        let extraShipping = Number(req.body.shipping_cost || 0);

        if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 30 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerName.length < 2 || customerName.length > 120 || customerPhone.length < 6 || shippingAddress.length < 8 || !Number.isFinite(extraShipping) || extraShipping < 0 || extraShipping > 250000) {
            return res.status(400).json({ error: 'Los datos de la orden son inválidos.' });
        }
        const requestedItems = new Map();
        for (const item of rawItems) {
            const productId = Number.parseInt(item.product_id, 10);
            const quantity = Number.parseInt(item.quantity, 10);
            const variantName = item.variant_name ? String(item.variant_name).trim() : null;
            if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
                return res.status(400).json({ error: 'Hay un producto o una cantidad inválida.' });
            }
            const key = `${productId}:${variantName || ''}`;
            const current = requestedItems.get(key);
            requestedItems.set(key, { productId, variantName, quantity: (current?.quantity || 0) + quantity });
        }

        const secureItems = [];
        for (const item of requestedItems.values()) {
            const { data: product, error } = await supabase
                .from('products')
                .select('id, name, price, stock, variants')
                .eq('id', item.productId)
                .single();
            if (error || !product) return res.status(404).json({ error: 'Uno de los productos ya no está disponible.' });

            const variants = parseVariants(product.variants);
            const selectedVariant = item.variantName ? variants.find((variant) => variantNameFor(variant) === item.variantName) : null;
            if (variants.length > 0 && !selectedVariant) {
                return res.status(400).json({ error: `Selecciona una variante válida para ${product.name}.` });
            }

            const availableStock = selectedVariant ? Number(selectedVariant.stock) : Number(product.stock);
            if (!Number.isInteger(availableStock) || availableStock < item.quantity || Number(product.stock) < item.quantity) {
                return res.status(409).json({ error: `${product.name} no tiene stock suficiente.` });
            }

            const variantPrice = selectedVariant ? Number(selectedVariant.price) : NaN;
            const unitPrice = Number.isFinite(variantPrice) && variantPrice >= 0 ? variantPrice : Number(product.price);
            if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Precio inválido para ${product.name}`);

            secureItems.push({ ...item, product, variants, unitPrice });
        }

        const stockUpdates = new Map();
        for (const item of secureItems) {
            const current = stockUpdates.get(item.product.id) || {
                product: item.product,
                quantity: 0,
                variants: item.variants.map((variant) => ({ ...variant }))
            };
            current.quantity += item.quantity;
            if (current.quantity > Number(current.product.stock)) {
                return res.status(409).json({ error: `${current.product.name} no tiene stock suficiente.` });
            }
            if (item.variantName) {
                current.variants = current.variants.map((variant) => (
                    variantNameFor(variant) === item.variantName
                        ? { ...variant, stock: Number(variant.stock) - item.quantity }
                        : variant
                ));
            }
            stockUpdates.set(item.product.id, current);
        }

        const totalQuantity = secureItems.reduce((sum, item) => sum + item.quantity, 0);
        const wholesaleDiscount = totalQuantity >= 10 ? 10 : totalQuantity >= 5 ? 7 : totalQuantity >= 3 ? 5 : 0;
        const productsSubtotal = secureItems.reduce((sum, item) => sum + Math.max(1, item.unitPrice - wholesaleDiscount) * item.quantity, 0);

        const settings = await getStoreSettings();
        const couponCode = String(req.body.discount_code || '').trim().toUpperCase();
        let discountUsd = 0;
        if (couponCode) {
            const coupon = Array.isArray(settings.coupons) && settings.coupons.find((entry) => String(entry.code || '').toUpperCase() === couponCode);
            if (!coupon) return res.status(400).json({ error: 'El cupón no es válido.' });
            if (coupon.type === 'percent') discountUsd = productsSubtotal * Math.min(100, Math.max(0, Number(coupon.value) || 0)) / 100;
            if (coupon.type === 'fixed') discountUsd = Math.min(productsSubtotal, Math.max(0, Number(coupon.value) || 0));
            if (coupon.type === 'shipping') extraShipping = 0;
        }

        const dollarRate = Number(process.env.DOLLAR_RATE) || 1400;
        const total = Math.max(0, productsSubtotal - discountUsd + extraShipping / dollarRate);
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_id: req.user.id,
                total,
                shipping_address: shippingAddress,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                payment_method: paymentMethod,
                shipping_method: shippingMethod,
                status: 'pending'
            }])
            .select('id')
            .single();
        if (orderError) throw orderError;

        const orderItems = secureItems.map((item) => ({
            order_id: orderData.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.unitPrice,
            variant_name: item.variantName
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
            await supabase.from('orders').delete().eq('id', orderData.id);
            throw itemsError;
        }

        for (const update of stockUpdates.values()) {
            const { data: updatedProduct, error: stockError } = await supabase
                .from('products')
                .update({ stock: Number(update.product.stock) - update.quantity, variants: update.variants })
                .eq('id', update.product.id)
                .eq('stock', update.product.stock)
                .select('id');
            if (stockError || !updatedProduct?.length) {
                await supabase.from('orders').delete().eq('id', orderData.id);
                return res.status(409).json({ error: 'El stock cambió mientras procesábamos tu compra. Vuelve a intentarlo.' });
            }
        }

        const totalArs = Math.round((productsSubtotal - discountUsd) * dollarRate + extraShipping);
        const itemList = secureItems.map((item) => `${item.quantity}x ${escapeHtml(item.product.name)}${item.variantName ? ` (${escapeHtml(item.variantName)})` : ''}`).join('<br>');
        const customerSummary = `Nombre: ${escapeHtml(customerName)}<br>Email: ${escapeHtml(customerEmail)}<br>Dirección: ${escapeHtml(shippingAddress)}`;
        const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            void sendEmail(adminEmail, `Nueva orden PhoneSpot #${orderData.id}`, `<h1>Nueva orden</h1><p><strong>Orden #${escapeHtml(orderData.id)}</strong></p><p>${customerSummary}</p><p><strong>Productos:</strong><br>${itemList}</p><p>Total: ${total.toFixed(2)} USD</p>`);
        }
        void sendEmail(customerEmail, `Confirmación de orden #${orderData.id}`, `<h1>¡Compra confirmada!</h1><p>Hola ${escapeHtml(customerName)}, recibimos tu orden #${escapeHtml(orderData.id)}.</p><p><strong>Productos:</strong><br>${itemList}</p><p>Total: ${total.toFixed(2)} USD</p><p>Coordina el pago con nosotros por WhatsApp.</p>`);

        void supabase.from('site_events').insert([{ event_type: 'order_created', page_path: '/checkout.html' }]);
        res.status(201).json({ message: 'Orden creada', orderId: orderData.id, total, total_ars: totalArs });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'No pudimos crear la orden. Intenta nuevamente.' });
    }
});

// NUEVAS RUTAS
app.get('/api/my-orders', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').select('*, order_items(*, products(name, image_url))').eq('user_id', req.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id/status', authenticate, isAdmin, async (req, res) => {
    try {
        const allowedStatuses = new Set(['pending', 'confirmed', 'completed', 'preparing', 'shipped', 'delivered', 'cancelled']);
        const status = String(req.body.status || '');
        const trackingCode = req.body.tracking_code == null ? null : String(req.body.tracking_code).trim().slice(0, 100);
        if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Estado de orden inválido' });
        const { data, error } = await supabase.from('orders').update({
            status,
            tracking_code: trackingCode || null,
            updated_at: new Date().toISOString()
        }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data?.length) return res.status(404).json({ error: 'Orden no encontrada' });
        void sendOrderStatusEmail(data[0]);
        res.json({ message: 'Orden actualizada', order: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const productId = Number.parseInt(req.body.product_id, 10);
        const rating = Number.parseInt(req.body.rating, 10);
        const comment = String(req.body.comment || '').trim();
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 2 || comment.length > 2000) {
            return res.status(400).json({ error: 'La reseña no es válida' });
        }
        const { data: purchase } = await supabase
            .from('orders')
            .select('id, order_items!inner(product_id)')
            .eq('user_id', req.user.id)
            .eq('order_items.product_id', productId)
            .limit(1);
        if (!purchase?.length) return res.status(403).json({ error: 'Solo podés reseñar productos que hayas comprado.' });
        const { error } = await supabase.from('reviews').insert([{
            product_id: productId,
            user_id: req.user.id,
            user_name: req.user.name || 'Cliente',
            rating,
            comment,
            approved: false
        }]);
        if (error) throw error;
        res.json({ message: 'Reseña enviada para revisión.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/:product_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('reviews').select('*').eq('product_id', req.params.product_id).eq('approved', true).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/reviews', authenticate, isAdmin, async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, products(name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/reviews/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const approved = req.body.approved === true;
        const { data, error } = await supabase.from('reviews')
            .update({ approved, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select('id, approved')
            .single();
        if (error || !data) return res.status(404).json({ error: 'Reseña no encontrada.' });
        res.json({ message: approved ? 'Reseña publicada.' : 'Reseña ocultada.', review: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders', authenticate, isAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, price))')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/analytics', authenticate, isAdmin, async (_req, res) => {
    try {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const [{ count: views, error: viewsError }, { count: carts, error: cartsError }, { count: checkouts, error: checkoutsError }, { data: products, error: productsError }] = await Promise.all([
            supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view').gte('created_at', since),
            supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_type', 'add_to_cart').gte('created_at', since),
            supabase.from('site_events').select('*', { count: 'exact', head: true }).eq('event_type', 'checkout_started').gte('created_at', since),
            supabase.from('site_events').select('product_id').eq('event_type', 'product_view').gte('created_at', since)
        ]);
        if (viewsError || cartsError || checkoutsError || productsError) throw viewsError || cartsError || checkoutsError || productsError;
        const productViews = (products || []).reduce((totals, event) => {
            if (event.product_id) totals[event.product_id] = (totals[event.product_id] || 0) + 1;
            return totals;
        }, {});
        res.json({ period_days: 30, page_views: views || 0, add_to_cart: carts || 0, checkout_started: checkouts || 0, product_views: productViews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN: ELIMINAR Y ACTUALIZAR PRODUCTOS ---
app.delete('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.put('/api/products/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock, price, variants, description } = req.body;
        
        const updateData = {};
        if (description !== undefined) updateData.description = description;
        if (stock !== undefined) {
            const parsedStock = Number.parseInt(stock, 10);
            if (!Number.isInteger(parsedStock) || parsedStock < 0) return res.status(400).json({ error: 'Stock inválido' });
            updateData.stock = parsedStock;
        }
        if (price !== undefined) {
            const parsedPrice = Number(price);
            if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'Precio inválido' });
            updateData.price = parsedPrice;
        }
        
        if (variants !== undefined) {
            const parsedVariants = parseVariants(variants);
            if (typeof variants === 'string' && variants.trim() && parsedVariants.length === 0) return res.status(400).json({ error: 'Variantes inválidas' });
            updateData.variants = parsedVariants;
        }
        if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No hay datos para actualizar' });
        
        const { data: updatedProducts, error } = await supabase.from('products').update(updateData).eq('id', id).select('id, name, stock');
        if (error) throw error;
        void notifyStockAlerts(updatedProducts?.[0]);
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error PUT product:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

// ==================== SHIPPING ZIPNOVA API ====================
app.post('/api/shipping/quote', async (req, res) => {
    try {
        const zipCode = String(req.body.zip_code || '').trim();
        if (!/^\d{4,5}$/.test(zipCode)) return res.status(400).json({ success: false, error: 'Código postal inválido' });
        
        const isLocal = ['3280', '3283', '3265', '3260'].includes(zipCode);
        
        if (isLocal) {
            return res.json({
                success: true,
                options: [
                    { id: 'local', name: 'Envío Local (Cadetería)', cost: 0, time: '24hs' }
                ]
            });
        }
        
        // Fetch current settings from Supabase to use the admin's exact custom prices
        const adminSettings = { shipping_correo: 8500, shipping_andreani: 12000, ...await getStoreSettings() };
        
        // Calculadora de Zonas Interna (Reemplazo Inteligente de Zipnova)
        let modifier = 1.0;
        if (zipCode.startsWith('9')) modifier = 1.6; // Patagonia (60% más caro)
        else if (zipCode.startsWith('4') || zipCode.startsWith('5')) modifier = 1.3; // Norte/Cuyo (30% más)
        
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
    }
});


// --- MARKETING ENDPOINT ---
app.post('/api/marketing/offers', authenticate, isAdmin, async (req, res) => {
    try {
        const subject = String(req.body.subject || '¡Descubre nuestras nuevas ofertas en PhoneSpot!').trim().slice(0, 150);
        const message = String(req.body.message || '').trim().slice(0, 5000);
        const link = String(req.body.link || 'https://phonespot.com.ar/catalogo.html').trim();
        if (!message || !/^https?:\/\//i.test(link)) return res.status(400).json({ error: 'Mensaje o enlace inválido' });
        
        // Obtener todos los usuarios registrados
        const { data: users, error } = await supabase.from('users').select('email, name');
        if (error) throw error;
        
        const marketingHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #e74c3c; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Nueva Oferta Exclusiva!</h1>
                </div>
                <div style="padding: 20px; font-size: 16px;">
                    ${escapeHtml(message).replace(/\n/g, '<br>')}
                    <br><br>
                    <div style="text-align: center;">
                        <a href="${escapeHtml(link)}" style="display: inline-block; background: #111; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Ver Oferta</a>
                    </div>
                    <br><br>
                    <p style="font-size: 12px; color: #888;">Recibes este correo porque te registraste en PhoneSpot.ar</p>
                </div>
            </div>
        `;
        
        // Send email to all users
        for (let user of users) {
            void sendEmail(user.email, subject, marketingHtml);
        }
        
        res.json({ message: `Correos de marketing enviados a ${users.length} usuarios.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error enviando marketing' });
    }
});

app.use((error, _req, res, _next) => {
    if (error instanceof multer.MulterError || error.message === 'Solo se permiten imágenes.') {
        return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Origen no permitido por CORS') {
        return res.status(403).json({ error: 'Origen no permitido' });
    }
    console.error('Unhandled request error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
module.exports = app;
