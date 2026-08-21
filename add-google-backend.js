const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

const backendGoogleLogic = `
// --- GOOGLE OAUTH LOGIN/REGISTER ---
app.post('/api/auth/google', async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ error: 'Token requerido' });
        
        // Fetch user info from Google
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: \`Bearer \${access_token}\` }
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
            const welcomeHtml = \`
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                    <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                        <h1>¡Bienvenido a PhoneSpot, \${name}!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Hola <b>\${name}</b>,</p>
                        <p>Gracias por registrarte usando Google. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                        <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas en celulares, notebooks y accesorios.</p>
                        <br>
                        <a href="https://phonespot.com.ar/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                        <br><br>
                        <p>¡Saludos!<br>El equipo de PhoneSpot</p>
                    </div>
                </div>
            \`;
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
`;

if (!server.includes('/api/auth/google')) {
    server = server.replace(/app\.post\('\/api\/login', async \(req, res\) => \{/, backendGoogleLogic + '\napp.post(\'/api/login\', async (req, res) => {');
    fs.writeFileSync('server.js', server, 'utf8');
    console.log('server.js updated with Google OAuth backend logic');
}
