const fs = require('fs');

const CLIENT_ID = '31583713582-ur3n2o5b9or6anv24mac34e69r35bauu.apps.googleusercontent.com';

// 1. Inject Google script into login.html and register.html
['public/login.html', 'public/register.html'].forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    
    // Add script tag to head
    if (!html.includes('https://accounts.google.com/gsi/client')) {
        html = html.replace('</head>', '    <script src="https://accounts.google.com/gsi/client" async defer></script>\n</head>');
    }
    
    // Change onclick of google button
    html = html.replace(/onclick="alert\('Integración con Google próximamente'\);"/, 'onclick="handleGoogleLogin()"');
    
    fs.writeFileSync(file, html, 'utf8');
});
console.log('HTML files updated for Google Login');

// 2. Add Google Login logic to script.js
let script = fs.readFileSync('public/script.js', 'utf8');

const googleLogic = `
// ==================== GOOGLE LOGIN ====================
window.handleGoogleLogin = () => {
    // Para que funcione con un botón personalizado, usamos el flujo implícito
    // pero como GIS restringe los botones personalizados para ID tokens, usamos una API estándar o el One Tap.
    // Usaremos google.accounts.oauth2.initTokenClient para obtener el perfil de forma segura
    
    if (typeof google === 'undefined') {
        return showToast('Google no está cargado. Revisa tu conexión.', 'fa-triangle-exclamation');
    }
    
    const client = google.accounts.oauth2.initTokenClient({
        client_id: '${CLIENT_ID}',
        scope: 'email profile',
        callback: async (response) => {
            if (response.error) {
                console.error(response);
                return showToast('Error al conectar con Google', 'fa-triangle-exclamation');
            }
            
            showToast('Conectando con el servidor...', 'fa-spinner fa-spin');
            
            try {
                // Enviar token al backend
                const res = await fetch(window.API_URL + '/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: response.access_token })
                });
                
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.role);
                    showToast('¡Ingreso exitoso!', 'fa-check');
                    setTimeout(() => window.location.href = data.role === 'admin' ? 'admin.html' : 'perfil.html', 1500);
                } else {
                    showToast(data.error || 'Error en el servidor', 'fa-triangle-exclamation');
                }
            } catch (err) {
                showToast('Error de conexión', 'fa-triangle-exclamation');
            }
        },
    });
    client.requestAccessToken();
};
`;

if (!script.includes('handleGoogleLogin')) {
    script += '\n' + googleLogic;
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('script.js updated with Google logic');
}
