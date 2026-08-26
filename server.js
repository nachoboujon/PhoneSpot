const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Interceptar producto.html para inyectar Meta Tags (SEO/WhatsApp)
app.get('/producto.html', async (req, res, next) => {
    const id = req.query.id;
    if (!id) return next();
    
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error || !data) return next();
        
        let html = fs.readFileSync(path.join(__dirname, 'public', 'producto.html'), 'utf8');
        
        const imageUrl = data.image_url.startsWith('http') ? data.image_url : 'http://' + req.get('host') + data.image_url;
        
        const metaTags = `
            <meta property="og:title" content="${data.name} | PhoneSpot">
            <meta property="og:description" content="Mira este equipo increíble disponible en PhoneSpot.">
            <meta property="og:image" content="${imageUrl}">
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
const upload = multer({ storage: storage });

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ ADVERTENCIA: SUPABASE_URL y SUPABASE_KEY no están configurados en las variables de entorno. La base de datos no funcionará.');
}

// Configuración Email
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Middleware de autenticación propio

// Función genérica para enviar emails
const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Faltan configurar las credenciales de email (EMAIL_USER y EMAIL_PASS)');
            return false;
        }
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to', to, 'via Gmail/Nodemailer');
        return true;
    } catch (err) {
        console.error('Error sending email:', err.message);
        return false;
    }
};

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Acceso denegado' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
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


app.get('/api/test-email', async (req, res) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({ success: false, error: 'Faltan credenciales en Railway' });
        }
        const info = await transporter.sendMail({
            from: '"PhoneSpot" <' + process.env.EMAIL_USER + '>',
            to: process.env.EMAIL_USER,
            subject: 'Test de Diagnóstico Nodemailer',
            text: 'Si llega esto, el puerto SMTP está abierto en Railway.'
        });
        res.json({ success: true, info });
    } catch (err) {
        res.json({ success: false, error: err.message, stack: err.stack, code: err.code, syscall: err.syscall });
    }
});

app.get('/api/version', (req, res) => {
    res.json({ version: '1.0.5', status: 'El servidor está corriendo el código más nuevo con la doble verificación.' });
});

app.post('/api/register', async (req, res) => {
    try {
        
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) return res.status(400).json({ error: 'El email ya está registrado' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'client';
        
        // Generate verification token (expires in 1 hour)
        const jwt = require('jsonwebtoken');
        const verificationToken = jwt.sign(
            { name, email, password: hashedPassword, role }, 
            process.env.JWT_SECRET || 'secreto_super_seguro', 
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
                    <p style="font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 10px;">Hola <strong style="color: #000;">${name}</strong>,</p>
                    <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 30px;">Estamos encantados de tenerte. Para garantizar la seguridad de tu cuenta y activar tus beneficios, necesitamos verificar tu dirección de correo electrónico.</p>
                    
                    <a href="${verifyLink}" style="display: inline-block; background-color: #0071e3; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0, 113, 227, 0.3);">Verificar mi Cuenta</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                        <p style="font-size: 12px; color: #999999; line-height: 1.5; margin: 0;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><span style="color:#0071e3">${verifyLink}</span></p>
                        <p style="font-size: 12px; color: #999999; margin-top: 15px;">Si tú no solicitaste este registro, puedes ignorar o eliminar este correo de forma segura. El enlace expirará automáticamente en 24 horas.</p>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
                    <p style="font-size: 12px; color: #888888; margin: 0;">© 2026 PhoneSpot. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        
        try {
            await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
            res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.' });
        } catch(emailErr) {
            res.status(500).json({ error: 'Tu cuenta está reservada, pero hubo un problema enviando el correo. Contacta a soporte.' });
        }


    } catch (error) {
        if(error.code === '23505') return res.status(400).json({ error: 'El email ya existe' }); // código postgres para unique violation
        res.status(500).json({ error: error.message });
    }
});


// --- GOOGLE OAUTH LOGIN/REGISTER ---
app.post('/api/auth/google', async (req, res) => {
    try {
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
        
        const email = googleUser.email;
        const name = googleUser.name || email.split('@')[0];
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'client';
        
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
                        <h1>¡Bienvenido a PhoneSpot, ${name}!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hola <b>${name}</b>,</p>
                        <p>Gracias por registrarte usando Google. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                        <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas en celulares, notebooks y accesorios.</p>
                        <br>
                        <a href="https://phonespot.com.ar/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                        <br><br>
                        <p>¡Saludos!<br>El equipo de PhoneSpot</p>
                    </div>
                </div>
            `;
            try { sendEmail(email, '¡Bienvenido a PhoneSpot!', welcomeHtml); } catch(e){}
        }
        
        // Generate JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secreto_super_seguro');
        
        res.json({ message: 'Login con Google exitoso', token, role: user.role, name: user.name });
        
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ error: 'Error interno conectando con Google' });
    }
});


// --- VERIFICACIÓN DE EMAIL (STATELESS) ---
app.get('/api/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send('Token inválido o expirado.');
        
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        
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
                    <h1>¡Bienvenido a PhoneSpot, ${decoded.name}!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <b>${decoded.name}</b>,</p>
                    <p>Tu cuenta ha sido verificada exitosamente. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                    <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas.</p>
                    <br>
                    <a href="https://phonespot.com.ar/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
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
        const { email, password } = req.body;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const user = data;
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Contraseña incorrecta' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secreto_super_seguro');
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
        
        data.forEach(prod => {
            if (prod.variants) {
                while (typeof prod.variants === 'string') {
                    try { prod.variants = JSON.parse(prod.variants); }
                    catch(e) { break; }
                }
                if (!Array.isArray(prod.variants)) prod.variants = [];
            }
        });

        
        data.forEach(p => {
            if (p.variants && typeof p.variants === 'string') {
                try { p.variants = JSON.parse(p.variants); } catch(e) { p.variants = []; }
            }
        });
        
        data.forEach(p => {
            if (p.variants && typeof p.variants === 'string') {
                try { p.variants = JSON.parse(p.variants); } catch(e) { p.variants = []; }
            }
        });
        
        data.forEach(p => {
            if (p.variants && typeof p.variants === 'string') {
                try { p.variants = JSON.parse(p.variants); } catch(e) { p.variants = []; }
            }
        });
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
        
        if (data.variants) {
            while (typeof data.variants === 'string') {
                try { data.variants = JSON.parse(data.variants); }
                catch(e) { break; }
            }
            if (!Array.isArray(data.variants)) data.variants = [];
        }

        
        if (data.variants && typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch(e) { data.variants = []; }
        }
        
        if (data.variants && typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch(e) { data.variants = []; }
        }
        
        if (data.variants && typeof data.variants === 'string') {
            try { data.variants = JSON.parse(data.variants); } catch(e) { data.variants = []; }
        }
        res.json(data);
    
    
    
    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', authenticate, isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, brand, stock, is_offer, category, variants } = req.body;
        
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
        
        let parsedVariants = [];
        try { if(variants) parsedVariants = JSON.parse(variants); } catch(e){}

        const { data, error } = await supabase
            .from('products')
            .insert([{ 
                name, 
                description, 
                price: parseFloat(price), 
                brand, 
                category: category || 'celulares', 
                stock: parseInt(stock), 
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


// MERCADO PAGO INTEGRATION
app.post('/api/mercadopago/preference', async (req, res) => {
    try {
        const { items, customer_email, total_ars } = req.body;
        
        const mpAccessToken = process.env.MP_ACCESS_TOKEN;
        if (!mpAccessToken) {
            return res.status(400).json({ error: 'Mercado Pago no configurado en el servidor' });
        }
        
        const preference = {
            items: [
                {
                    title: 'Compra en PhoneSpot',
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: total_ars
                }
            ],
            payer: { email: customer_email },
            back_urls: {
                success: req.headers.origin + '/perfil.html',
                failure: req.headers.origin + '/carrito.html',
                pending: req.headers.origin + '/perfil.html'
            },
            auto_return: 'approved'
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });
        
        const data = await response.json();
        if (data.init_point) {
            res.json({ init_point: data.init_point });
        } else {
            res.status(500).json({ error: 'Error de MercadoPago', details: data });
        }
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: 'Error procesando Mercado Pago' });
    }
});

// --- RUTAS DE ORDENES ---
app.post('/api/orders', async (req, res) => {
    try {
        const { items, shipping_address, customer_email, customer_name, payment_method, shipping_cost } = req.body; 
        
        let user_id = null;
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const jwt = require('jsonwebtoken');
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
                user_id = verified.id;
            } catch(e) { }
        }

        const extraShipping = Number(shipping_cost) || 0;
        
        
        let totalQuantity = 0;
        items.forEach(item => totalQuantity += item.quantity);
        let wholesaleDiscount = 0;
        if (totalQuantity >= 10) wholesaleDiscount = 10;
        else if (totalQuantity >= 5) wholesaleDiscount = 7;
        else if (totalQuantity >= 3) wholesaleDiscount = 5;
        const isWholesale = wholesaleDiscount > 0;


        const usdTotal = items.reduce((acc, item) => {
            let finalPrice = item.price;
            if (isWholesale) finalPrice = Math.max(1, finalPrice - wholesaleDiscount);
            return acc + (finalPrice * item.quantity);
        }, 0);
        const dolarValue = Number(req.body.dolar_value) || 1400;
        const discountUsd = Number(req.body.discount_amount) || 0;
        const total = usdTotal + (extraShipping / dolarValue) - discountUsd;
        
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ user_id, total, shipping_address }])
            .select();
            
        if (orderError) throw orderError;
        const orderId = orderData[0].id;
        
        for (const item of items) {
            if(item.product_id) {
                await supabase.from('order_items').insert([{
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    variant_name: item.variant_name || null
                }]);

                const { data: prodData } = await supabase.from('products').select('stock, variants').eq('id', item.product_id).single();
                if (prodData) {
                    let newStock = prodData.stock - item.quantity;
                    newStock = newStock < 0 ? 0 : newStock;
                    
                    let newVariants = prodData.variants;
                    if (newVariants && item.variant_name) {
                        newVariants = newVariants.map(v => {
                            const vName = [v.color, v.capacity, v.ram].filter(Boolean).join(' - ');
                            if (vName === item.variant_name && v.stock > 0) v.stock -= item.quantity;
                            return v;
                        });
                    }
                    await supabase.from('products').update({ stock: newStock, variants: newVariants }).eq('id', item.product_id);
                }
            }
        }

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
        if (payment_method === 'mercadopago') {
            if (!MP_ACCESS_TOKEN) {
                return res.status(200).json({ message: 'Orden creada, pero falta MP', orderId });
            }
            const dolarValue = Number(req.body.dolar_value) || 1400;
            const mpItems = items.map(item => ({
                title: 'Producto PhoneSpot ' + (item.variant_name ? '('+item.variant_name+')' : ''),
                unit_price: Math.round(Number(item.price) * dolarValue),
                quantity: Number(item.quantity),
                currency_id: 'ARS'
            }));
            if (extraShipping > 0) {
                mpItems.push({ title: 'Costo de Envío', unit_price: extraShipping, quantity: 1, currency_id: 'ARS' });
            }
            const preferenceData = {
                items: mpItems,
                payer: { name: customer_name, email: customer_email },
                back_urls: {
                    success: req.headers.origin + '/perfil.html?pago=exito',
                    failure: req.headers.origin + '/carrito.html?pago=error',
                    pending: req.headers.origin + '/perfil.html?pago=pendiente'
                },
                auto_return: 'approved',
                external_reference: orderId.toString(),
                notification_url: 'https://phonespot.site/api/mercadopago/webhook',
                payment_methods: {
                    excluded_payment_types: [
                        { id: 'credit_card' }
                    ],
                    installments: 1
                }
            };
            const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + MP_ACCESS_TOKEN, 'Content-Type': 'application/json' },
                body: JSON.stringify(preferenceData)
            });
            const mpData = await mpResponse.json();
            if (mpResponse.ok && mpData.init_point) {
                return res.status(200).json({ init_point: mpData.init_point });
            } else {
                console.error('MP ERROR:', mpData); return res.status(400).json({ error: 'Error MP', details: mpData });
            }
        }

        
        // =========== ENVÍO DE EMAIL AL DUEÑO ===========
        try {
            let itemsList = '';
            items.forEach(i => {
                itemsList += '- ' + i.quantity + 'x ' + (i.name || 'Producto') + ' (' + (i.variant_name || 'Sin variante') + ')\n';
            });

            const htmlContent = '<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">' +
                '<div style="background: #111; padding: 20px; text-align: center;">' +
                    '<h1 style="color: white; margin: 0;">¡Nueva Venta en PhoneSpot! 🎉</h1>' +
                '</div>' +
                '<div style="padding: 20px; font-size: 16px;">' +
                    '<p><strong>Orden #' + orderId + '</strong></p>' +
                    '<p><strong>Detalles del cliente:</strong><br>' +
                    'Nombre: ' + customer_name + '<br>' +
                    'Email: ' + customer_email + '<br>' +
                    'Dirección: ' + shipping_address + '<br>' +
                    'Método de pago: ' + payment_method + '<br>' +
                    'Total de la orden: ' + total.toFixed(2) + ' USD</p>' +
                    '<p><strong>Productos comprados:</strong><br>' +
                    itemsList.replace(/\n/g, '<br>') + '</p>' +
                    '<p style="font-size: 12px; color: #888; margin-top: 20px;">Revisa tu panel de administrador para más detalles.</p>' +
                '</div>' +
            '</div>';

            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (adminEmail) {
                sendEmail(adminEmail, '🎉 ¡Nueva Venta en PhoneSpot! - Orden #' + orderId, htmlContent);
                console.log('Email de notificación enviado al admin vía Brevo.');
            }
        } catch (mailErr) {
            console.error('Error enviando email:', mailErr);
        }
        // ===============================================

        
            // Email de confirmación AL CLIENTE
            if (customer_email) {
                let itemsListHtml = '';
                items.forEach(i => {
                    itemsListHtml += '- ' + i.quantity + 'x ' + (i.name || 'Producto') + ' (' + (i.variant_name || 'Sin variante') + ')<br>';
                });

                const orderHtml = '<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">' +
                    '<div style="background: #00a650; color: #fff; padding: 20px; text-align: center;">' +
                        '<h1>¡Compra Confirmada!</h1>' +
                    '</div>' +
                    '<div style="padding: 20px;">' +
                        '<p>Hola <b>' + (customer_name || 'Cliente') + '</b>,</p>' +
                        '<p>Hemos recibido tu orden <b>#' + orderId + '</b> con éxito.</p>' +
                        '<p><b>Resumen de tu compra:</b><br>' + itemsListHtml + '</p>' +
                        '<p>Total de la orden: <b>' + total.toFixed(2) + ' USD</b></p>' +
                        '<p>Dirección de Envío: ' + shipping_address + '</p>' +
                        '<p>Método de Pago: Efectivo / Transferencia</p>' +
                        '<p>Por favor, coordina el pago con nosotros a través de nuestro WhatsApp. Una vez confirmado, comenzaremos a preparar tu paquete.</p>' +
                        '<br>' +
                        '<p>¡Gracias por confiar en PhoneSpot!</p>' +
                    '</div>' +
                '</div>';
                sendEmail(customer_email, 'Confirmación de Orden #' + orderId + ' - PhoneSpot', orderHtml);
            }

        res.json({ message: 'Orden creada', orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        const { status, tracking_code } = req.body;
        const { data, error } = await supabase.from('orders').update({ status, tracking_code }).eq('id', req.params.id).select();
        if (error) throw error;
        res.json({ message: 'Orden actualizada', order: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reviews', authenticate, async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;
        const { error } = await supabase.from('reviews').insert([{ product_id, user_name: req.user.name, rating, comment }]);
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
        
        let updateData = {};
        if (description !== undefined) updateData.description = description;
        if (stock !== undefined) updateData.stock = parseInt(stock);
        if (price !== undefined) updateData.price = parseFloat(price);
        
        if (variants !== undefined) {
            if (typeof variants === 'string') {
                try {
                    updateData.variants = JSON.parse(variants);
                } catch(e) {
                    updateData.variants = [];
                }
            } else {
                updateData.variants = variants;
            }
        }
        
        const { error } = await supabase.from('products').update(updateData).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        console.error('Error PUT product:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    // Railway, Local, or VPS: Start the server on 0.0.0.0 so it's accessible externally
    
// ==================== SHIPPING ZIPNOVA API ====================
app.post('/api/shipping/quote', async (req, res) => {
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
    }
});


// --- MARKETING ENDPOINT ---
app.post('/api/marketing/offers', authenticate, isAdmin, async (req, res) => {
    try {
        const { subject, message, link } = req.body;
        
        // Obtener todos los usuarios registrados
        const { data: users, error } = await supabase.from('users').select('email, name');
        if (error) throw error;
        
        const marketingHtml = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #e74c3c; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Nueva Oferta Exclusiva!</h1>
                </div>
                <div style="padding: 20px; font-size: 16px;">
                    ${message}
                    <br><br>
                    <div style="text-align: center;">
                        <a href="${link || 'https://phonespot.com.ar/catalogo.html'}" style="display: inline-block; background: #111; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Ver Oferta</a>
                    </div>
                    <br><br>
                    <p style="font-size: 12px; color: #888;">Recibes este correo porque te registraste en PhoneSpot.ar</p>
                </div>
            </div>
        `;
        
        // Send email to all users
        for (let user of users) {
            sendEmail(user.email, subject || '¡Descubre nuestras nuevas ofertas en PhoneSpot!', marketingHtml);
        }
        
        res.json({ message: `Correos de marketing enviados a ${users.length} usuarios.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error enviando marketing' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}
module.exports = app;
