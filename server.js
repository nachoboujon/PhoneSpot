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
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer (motor para guardar archivos locales)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Usar el anon key o el service_role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware de autenticación propio
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
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'client';
        
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email, password: hashedPassword, role }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: data[0].id });
    } catch (error) {
        if(error.code === '23505') return res.status(400).json({ error: 'El email ya existe' }); // código postgres para unique violation
        res.status(500).json({ error: error.message });
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
            image_url = '/uploads/' + req.file.filename;
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

// --- RUTAS DE SETTINGS ---
app.get('/api/settings', (req, res) => {
    try {
        const settingsPath = path.join(__dirname, 'public', 'data', 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({ top_banner: "Lanzamiento...", carousel: [] });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error leyendo settings' });
    }
});

app.post('/api/upload', authenticate, isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió imagen' });
    res.json({ url: '/uploads/' + req.file.filename });
});

app.post('/api/settings', authenticate, isAdmin, (req, res) => {
    try {
        const settingsPath = path.join(__dirname, 'public', 'data', 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ message: 'Ajustes guardados correctamente' });
    } catch (err) {
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
                success: 'http://localhost:3000/perfil.html',
                failure: 'http://localhost:3000/carrito.html',
                pending: 'http://localhost:3000/perfil.html'
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
            if (isWholesale) finalPrice -= wholesaleDiscount;
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
            const mpItems = items.map(item => ({
                title: 'Producto PhoneSpot ' + (item.variant_name ? '('+item.variant_name+')' : ''),
                unit_price: Number(item.price),
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
                    success: 'http://localhost:3000/compra-exitosa.html',
                    failure: 'http://localhost:3000/index.html?pago=error',
                    pending: 'http://localhost:3000/index.html?pago=pendiente'
                },
                auto_return: 'approved'
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
                return res.status(400).json({ error: 'Error MP' });
            }
        }

        
        // =========== ENVÍO DE EMAIL AL DUEÑO ===========
        try {
            const nodemailer = require('nodemailer');
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                let itemsList = '';
                items.forEach(i => {
                    itemsList += `- ${i.quantity}x ${i.name || 'Producto'} (${i.variant_name || 'Sin variante'})\n`;
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                    subject: `🎉 ¡Nueva Venta en PhoneSpot! - Orden #${orderId}`,
                    text: `¡Hola! Alguien acaba de realizar una compra.\n\nDetalles del cliente:\nNombre: ${customer_name}\nEmail: ${customer_email}\nDirección: ${shipping_address}\nMétodo de pago: ${payment_method}\nTotal de la orden: ${total.toFixed(2)} USD\n\nProductos comprados:\n${itemsList}\n\nRevisa el panel de control o tu base de datos para gestionar el envío.`
                };

                await transporter.sendMail(mailOptions);
                console.log('Email de notificación enviado al admin.');
            } else {
                console.log('No se envió email porque falta configurar EMAIL_USER y EMAIL_PASS en el .env');
            }
        } catch (mailErr) {
            console.error('Error enviando email:', mailErr);
        }
        // ===============================================

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
        const { stock, price, variants } = req.body;
        
        let updateData = {};
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
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
