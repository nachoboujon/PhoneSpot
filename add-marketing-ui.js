const fs = require('fs');
let adminHtml = fs.readFileSync('public/admin.html', 'utf8');

const marketingHTML = `
            <!-- Marketing Email -->
            <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-envelope-open-text"></i> Enviar Oferta por Email a Clientes</h3>
                <form id="marketing-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label style="display: block; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem;">Asunto del Correo:</label>
                        <input type="text" id="marketing-subject" placeholder="Ej: ¡Llegó el CyberMonday a PhoneSpot!" required style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem;">Mensaje de la Oferta:</label>
                        <textarea id="marketing-message" rows="3" placeholder="Ej: Tenemos descuentos increíbles en toda la línea Apple solo por esta semana..." required style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);"></textarea>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem;">Enlace (opcional):</label>
                        <input type="url" id="marketing-link" placeholder="Ej: https://phonespot.com.ar/catalogo.html" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                    </div>
                    <button type="submit" style="background: #e74c3c; color: white; border: none; padding: 0.8rem; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fa-solid fa-paper-plane"></i> Enviar a Todos los Clientes
                    </button>
                </form>
            </div>
`;

// Insert it before </section> <!-- End config section -->
adminHtml = adminHtml.replace(/<\/section>\s*<!-- Script -->/, marketingHTML + '\n        </section>\n        <!-- Script -->');

const marketingJS = `
        // Marketing Form Logic
        const marketingForm = document.getElementById('marketing-form');
        if (marketingForm) {
            marketingForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!confirm('¿Estás seguro de que quieres enviar este correo MASIVO a todos los clientes registrados?')) return;
                
                const btn = e.target.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
                btn.disabled = true;
                
                try {
                    const res = await fetch('/api/marketing/offers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                        body: JSON.stringify({
                            subject: document.getElementById('marketing-subject').value,
                            message: document.getElementById('marketing-message').value,
                            link: document.getElementById('marketing-link').value
                        })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                        alert(data.message);
                        marketingForm.reset();
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (err) {
                    alert('Error de conexión');
                }
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        }
`;

// Insert logic inside script tag
adminHtml = adminHtml.replace(/loadSettings\(\);\s*\/\/ Setup Save Settings Form/, (match) => {
    return marketingJS + '\n\n            ' + match;
});

fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log('Added Marketing UI to admin.html');
