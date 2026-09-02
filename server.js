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
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = new URL(data.image_url || '/uploads/PhoneSpot-trans.png', baseUrl).toString();
        
        const metaTags = `
            <meta property="og:title" content="${escapeHtml(data.name)} | PhoneSpot">
            <meta property="og:description" content="Mira este equipo increíble disponible en PhoneSpot.">
            <meta property="og:image" content="${escapeHtml(imageUrl)}">
            <meta name="twitter:card" content="summary_large_image">
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
        const shippingAddress = String(req.body.shipping_address || '').trim();
        let extraShipping = Number(req.body.shipping_cost || 0);

        if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 30 || !/^\S+@\S+\.\S+$/.test(customerEmail) || customerName.length < 2 || shippingAddress.length < 8 || !Number.isFinite(extraShipping) || extraShipping < 0 || extraShipping > 250000) {
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
            .insert([{ user_id: req.user.id, total, shipping_address: shippingAddress }])
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
        const allowedStatuses = new Set(['pending', 'completed', 'cancelled', 'shipped']);
        const status = String(req.body.status || '');
        const trackingCode = req.body.tracking_code == null ? null : String(req.body.tracking_code).trim().slice(0, 100);
        if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Estado de orden inválido' });
        const { data, error } = await supabase.from('orders').update({ status, tracking_code: trackingCode || null }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data?.length) return res.status(404).json({ error: 'Orden no encontrada' });
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
        const { error } = await supabase.from('reviews').insert([{ product_id: productId, user_name: req.user.name || 'Cliente', rating, comment }]);
        if (error) throw error;
        res.json({ message: 'Reseña guardada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews/:product_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('reviews').select('*').eq('product_id', req.params.product_id).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
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
        
        const { error } = await supabase.from('products').update(updateData).eq('id', id);
        if (error) throw error;
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
