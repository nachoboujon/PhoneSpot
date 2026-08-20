const fs = require('fs');
let s = fs.readFileSync('public/admin.html', 'utf8');

const whatsappHtml = `
                <div class="admin-card">
                    <h4><i class="fa-brands fa-whatsapp"></i> Número de WhatsApp</h4>
                    <form id="admin-whatsapp-form">
                        <div class="form-group">
                            <label>Número para recibir pedidos (Incluir código país, ej: 5491123456789)</label>
                            <input type="text" id="set-whatsapp-num" placeholder="549..." required>
                        </div>
                        <button type="submit" class="btn" style="background-color: #2ecc71; color: white; border: none;">Guardar WhatsApp</button>
                    </form>
                </div>
`;

const couponsHtml = `
                <div class="admin-card">
                    <h4><i class="fa-solid fa-ticket"></i> Cupones de Descuento</h4>
                    <div id="coupons-list" style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
                    
                    <form id="admin-coupon-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Código (ej: PROMO20)</label>
                            <input type="text" id="add-coupon-code" required style="text-transform: uppercase;">
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Tipo</label>
                            <select id="add-coupon-type" required>
                                <option value="percent">Porcentaje (%)</option>
                                <option value="fixed">Monto Fijo (USD)</option>
                                <option value="shipping">Envío Gratis</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1; min-width: 150px;">
                            <label>Valor (ej: 15 para 15%)</label>
                            <input type="number" id="add-coupon-value" value="0" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn" style="background-color: var(--text-color);">Agregar Cupón</button>
                        </div>
                    </form>
                </div>
`;

s = s.replace('<!-- TAB: DISEÑO -->', '<!-- TAB: DISEÑO -->\n' + whatsappHtml + '\n' + couponsHtml);
fs.writeFileSync('public/admin.html', s, 'utf8');
console.log('Added WA and Coupons to admin.html');
