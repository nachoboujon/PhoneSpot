const fs = require('fs');

let adminHtml = fs.readFileSync('public/admin.html', 'utf8');

const bannerRegex = /<form id="admin-banner-form">[\s\S]*?<\/form>/;
const newBannerForm = `<form id="admin-banner-form">
                        <div class="form-group">
                            <label>Texto Promocional (Arriba del todo)</label>
                            <input type="text" id="set-banner" placeholder="Ej: 🔥 ENVÍO GRATIS EN COMPRAS SUPERIORES A $1000">
                        </div>
                        <div class="form-group">
                            <label>Fin de Oferta Relámpago (Cuenta Regresiva)</label>
                            <input type="datetime-local" id="set-flash-date">
                        </div>
                        <button type="submit" class="btn"><i class="fa-solid fa-save"></i> Guardar Ajustes Generales</button>
                    </form>`;

adminHtml = adminHtml.replace(bannerRegex, newBannerForm);
fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
console.log("admin.html updated!");
