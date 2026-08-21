const fs = require('fs');

let server = fs.readFileSync('server.js', 'utf8');

// 1. Add dotenv at the top
if (!server.includes("require('dotenv').config()")) {
    server = "require('dotenv').config();\n" + server;
}

// 2. Add /api/verify-email endpoint
const verifyEndpoint = `
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
        const welcomeHtml = \`
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #111; color: #fff; padding: 20px; text-align: center;">
                    <h1>¡Bienvenido a PhoneSpot, \${decoded.name}!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hola <b>\${decoded.name}</b>,</p>
                    <p>Tu cuenta ha sido verificada exitosamente. Ya eres parte de la comunidad de PhoneSpot, tu lugar de confianza para tecnología móvil.</p>
                    <p>Te invitamos a revisar nuestro catálogo y descubrir las mejores ofertas.</p>
                    <br>
                    <a href="https://phonespot.com.ar/catalogo.html" style="background: #111; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explorar Catálogo</a>
                </div>
            </div>
        \`;
        try { sendEmail(decoded.email, '¡Bienvenido a PhoneSpot!', welcomeHtml); } catch(e){}
        
        res.redirect('/login.html?verified=true');
    } catch (error) {
        console.error(error);
        res.status(400).send('<h2>El enlace es inválido o ha expirado. Por favor, regístrate de nuevo.</h2>');
    }
});
`;

if (!server.includes('/api/verify-email')) {
    server = server.replace(/app\.post\('\/api\/login'/, verifyEndpoint + '\napp.post(\'/api/login\'');
}

// 3. Modify /api/register to send verification email instead of inserting
const newRegisterLogic = `
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
        const verifyLink = \`\${protocol}://\${host}/api/verify-email?token=\${verificationToken}\`;
        
        const verifyHtml = \`
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
                <div style="background: #e74c3c; color: #fff; padding: 20px; text-align: center;">
                    <h1>Verifica tu cuenta</h1>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p>Hola <b>\${name}</b>,</p>
                    <p>Estás a un solo paso de unirte a PhoneSpot. Por seguridad, necesitamos verificar que este es tu correo electrónico.</p>
                    <br>
                    <a href="\${verifyLink}" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">Verificar mi Correo</a>
                    <br><br>
                    <p style="font-size: 12px; color: #888;">Este enlace expirará en 1 hora. Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
                </div>
            </div>
        \`;
        
        await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
        
        res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.' });
`;

// Replace the old register logic completely
server = server.replace(/const { name, email, password } = req\.body;[\s\S]*?res\.status\(201\)\.json\(\{ message: 'Usuario registrado exitosamente', userId: data\[0\]\.id \}\);/, newRegisterLogic);

// Also remove the old sendWelcome email from inside the old logic if it's there
server = server.replace(/\/\/ Enviar email de bienvenida[\s\S]*?sendEmail\(email, '¡Bienvenido a PhoneSpot!', welcomeHtml\);/g, '');


fs.writeFileSync('server.js', server, 'utf8');
console.log('server.js updated for Double Opt-In Email Verification');

// 4. Update script.js register form submit to handle the new message and NOT redirect immediately
let script = fs.readFileSync('public/script.js', 'utf8');
script = script.replace(/if \(res\.ok\) \{\s*showToast\('Registro exitoso', 'fa-check'\);\s*const urlParams = new URLSearchParams\(window\.location\.search\);\s*const redirect = urlParams\.get\('redirect'\);\s*setTimeout\(\(\) => window\.location\.href = 'login\.html' \+ \(redirect \? '\?redirect=' \+ redirect : ''\), 1500\);\s*\}/, `if (res.ok) {
                        showToast('Revisa tu correo para verificar tu cuenta', 'fa-envelope-open-text');
                        // Show a big message instead of redirecting
                        const formWrapper = document.querySelector('.auth-form-wrapper');
                        if (formWrapper) {
                            formWrapper.innerHTML = \`
                                <div style="text-align: center; padding: 2rem 0;">
                                    <i class="fa-solid fa-envelope-circle-check" style="font-size: 4rem; color: #00a650; margin-bottom: 1rem;"></i>
                                    <h2 style="margin-bottom: 1rem;">¡Casi listo!</h2>
                                    <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.5;">Te hemos enviado un enlace de confirmación a <b>\${email}</b>.</p>
                                    <p style="color: var(--text-muted); font-size: 1rem;">Haz clic en el enlace para activar tu cuenta.</p>
                                    <p style="font-size: 0.8rem; color: #888; margin-top: 2rem;">¿No lo encuentras? Revisa tu carpeta de Spam.</p>
                                </div>
                            \`;
                        }
                    }`);
fs.writeFileSync('public/script.js', script, 'utf8');

// 5. Add logic to login.html to show a success toast if URL has ?verified=true
if (!script.includes('verified=true')) {
    script += `
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        setTimeout(() => showToast('¡Cuenta verificada! Ya puedes iniciar sesión.', 'fa-check-circle'), 500);
    } else if (urlParams.get('verified') === 'already') {
        setTimeout(() => showToast('Tu cuenta ya estaba verificada. Inicia sesión.', 'fa-info-circle'), 500);
    }
});
`;
    fs.writeFileSync('public/script.js', script, 'utf8');
}
console.log('script.js updated with Email Verification UI');
