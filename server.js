const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', authenticate, isAdmin, async (req, res) => {
    try {
        const { name, description, price, image_url, brand, stock, is_offer } = req.body;
        const { data, error } = await supabase
            .from('products')
            .insert([{ name, description, price, image_url, brand, stock, is_offer: is_offer || false }])
            .select();
            
        if (error) throw error;
        res.status(201).json({ message: 'Producto creado', productId: data[0].id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE ORDENES ---
app.post('/api/orders', authenticate, async (req, res) => {
    try {
        const { items, shipping_address } = req.body; 
        const user_id = req.user.id;
        
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        
        // Crear orden
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{ user_id, total, shipping_address }])
            .select();
            
        if (orderError) throw orderError;
        const orderId = orderData[0].id;
        
        // Insertar items
        const orderItemsToInsert = items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItemsToInsert);
            
        if (itemsError) throw itemsError;

        // Descontar stock
        for (const item of items) {
            const { data: prodData } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (prodData) {
                await supabase.from('products').update({ stock: prodData.stock - item.quantity }).eq('id', item.product_id);
            }
        }
        
        // Enviar correos
        const { data: userData } = await supabase.from('users').select('name, email').eq('id', user_id).single();
        const userEmail = userData.email;
        const userName = userData.name;

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: userEmail,
                    subject: '¡Gracias por tu compra en PhoneSpot!',
                    text: `Hola ${userName},\n\nHemos recibido tu orden #${orderId} por un total de $${total}.\nDirección de envío: ${shipping_address}\n\nGracias por confiar en nosotros.`
                });

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: process.env.ADMIN_EMAIL,
                    subject: `Nueva venta en PhoneSpot - Orden #${orderId}`,
                    text: `El usuario ${userName} (${userEmail}) ha realizado una compra por $${total}.\nDirección: ${shipping_address}`
                });
            } catch (mailErr) {
                console.error("Error enviando correos:", mailErr);
            }
        }

        res.status(201).json({ message: 'Orden procesada con éxito', orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
