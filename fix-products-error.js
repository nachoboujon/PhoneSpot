const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const oldCatch = /\} catch \(err\) \{[\s\S]*?showToast\('Error al conectar con la base de datos\. Verifica que server\.js está corriendo\.', 'fa-triangle-exclamation'\);\s*\}/;

const newCatch = `} catch (err) {
        console.error("Error cargando productos:", err);
        if (catalogContainer) catalogContainer.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;"><b>ERROR DE CONEXIÓN AL SERVIDOR</b><br>Si ves esto en VIVO (phonespot.site), tienes un error en tus DNS (están apuntando a Cloudflare 1.1.1.1 en vez de a Railway).<br>Si ves esto en LOCAL, asegúrate de haber ejecutado <code>node server.js</code> y estar accediendo desde <code>localhost:3000</code> y NO desde un archivo local (file:///).</p>';
        showToast('Error de conexión a la API', 'fa-triangle-exclamation');
    }`;

if (oldCatch.test(script)) {
    script = script.replace(oldCatch, newCatch);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Added explicit on-screen error for database failure');
} else {
    console.log('Regex failed');
}
