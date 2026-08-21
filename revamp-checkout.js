const fs = require('fs');

let html = fs.readFileSync('public/checkout.html', 'utf8');

// Replace the checkout form part 1
const regexPart1 = /<div id="checkout-part1" class="checkout-part">[\s\S]*?<!-- PARTE 2: Pago -->/;
const newPart1 = `<div id="checkout-part1" class="checkout-part">
                        <div class="checkout-section">
                            <h3 style="margin-bottom:1.5rem; font-size:1.4rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;"><i class="fa-solid fa-address-card"></i> 1. Datos de Contacto</h3>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="chk-email" placeholder="tu@email.com" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                            </div>
                            <div class="form-group" style="display: flex; gap: 10px;">
                                <div style="flex:1;">
                                    <label>Nombre *</label>
                                    <input type="text" id="chk-name" placeholder="Ej: Juan" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                                <div style="flex:1;">
                                    <label>Apellido *</label>
                                    <input type="text" id="chk-lastname" placeholder="Ej: Pérez" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                            </div>
                            <div class="form-group" style="display: flex; gap: 10px;">
                                <div style="flex:1;">
                                    <label>DNI / CUIL *</label>
                                    <input type="number" id="chk-dni" placeholder="Sin puntos ni espacios" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                                <div style="flex:1;">
                                    <label>Teléfono (WhatsApp) *</label>
                                    <input type="tel" id="chk-phone" placeholder="Ej: 1123456789" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                            </div>
                        </div>

                        <div class="checkout-section" style="margin-top:2rem;">
                            <h3 style="margin-bottom:1.5rem; font-size:1.4rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;"><i class="fa-solid fa-truck"></i> 2. Datos de Envío</h3>
                            <div class="form-group">
                                <label>Dirección completa (Calle, Altura, Piso, Depto) *</label>
                                <input type="text" id="chk-address" placeholder="Ej: Av. Rivadavia 1234, Piso 2, Dpto A" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                            </div>
                            <div class="form-group" style="display: flex; gap: 10px;">
                                <div style="flex:2;">
                                    <label>Provincia / Ciudad *</label>
                                    <input type="text" id="chk-city" placeholder="Ej: CABA, Buenos Aires" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                                <div style="flex:1;">
                                    <label>Código Postal *</label>
                                    <input type="text" id="chk-zip" placeholder="Ej: 1414" required style="width:100%; padding:0.8rem; border-radius:8px; border:1px solid #ddd;">
                                </div>
                            </div>

                            <h4 style="margin-top:1.5rem; margin-bottom:1rem; font-size:1.1rem; color:#555;">Método de Envío</h4>
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                <label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var(--border-color); border-radius:8px; cursor:pointer; background:#fff;">
                                    <span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="correo" checked> <i class="fa-solid fa-box"></i> Correo Argentino (A Domicilio)</span>
                                    <span id="cost-correo" style="font-weight:bold; color:var(--text-color);">$8.500</span>
                                </label>
                                <label style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border: 1px solid var(--border-color); border-radius:8px; cursor:pointer; background:#fff;">
                                    <span style="display:flex; align-items:center; gap:10px;"><input type="radio" name="shipping_method" value="andreani"> <i class="fa-solid fa-truck-fast"></i> Andreani (A Domicilio)</span>
                                    <span id="cost-andreani" style="font-weight:bold; color:var(--text-color);">$12.000</span>
                                </label>
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="nextCheckoutStep()" style="width: 100%; padding: 1.2rem; font-size: 1.1rem; margin-top: 1.5rem; border-radius:12px; background: #000; color:#fff;">Continuar al Pago <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                    
                    <!-- PARTE 2: Pago -->`;

html = html.replace(regexPart1, newPart1);

// Replace the checkout form part 2
const regexPart2 = /<div id="checkout-part2" class="checkout-part" style="display: none;">[\s\S]*?<button type="submit"/;
const newPart2 = `<div id="checkout-part2" class="checkout-part" style="display: none;">
                        <div class="checkout-section">
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:1.5rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">
                                <button type="button" onclick="prevCheckoutStep()" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:#666;"><i class="fa-solid fa-arrow-left"></i></button>
                                <h3 style="margin:0; font-size:1.4rem;"><i class="fa-solid fa-credit-card"></i> 3. Medio de Pago</h3>
                            </div>
                            
                            <p style="color:#666; font-size:0.9rem; margin-bottom:1rem;">Todas las transacciones son seguras y están encriptadas.</p>

                            <div class="form-group" style="display:flex; flex-direction:column; gap:1rem;">
                                <label style="display:flex; align-items:flex-start; gap:1rem; cursor:pointer; padding:1.2rem; border: 2px solid #009ee3; border-radius:12px; background:#f5fbff; position:relative; overflow:hidden;">
                                    <input type="radio" name="payment_method" value="mercadopago" checked style="margin-top:0.4rem; transform:scale(1.2);">
                                    <div style="flex:1;">
                                        <strong style="display:block; color:#009ee3; font-size:1.1rem; margin-bottom:4px;">Tarjetas de Débito, Crédito y Mercado Pago</strong>
                                        <span style="font-size:0.85rem; color: #555; display:block; margin-bottom:8px;">Paga seguro con cualquier tarjeta (Visa, Mastercard, Cabal, etc) o con dinero en tu cuenta de MP.</span>
                                        <div style="display:flex; gap:5px; flex-wrap:wrap;">
                                            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" style="height:20px;">
                                            <i class="fa-brands fa-cc-visa" style="font-size:20px; color:#1a1f71;"></i>
                                            <i class="fa-brands fa-cc-mastercard" style="font-size:20px; color:#eb001b;"></i>
                                        </div>
                                    </div>
                                    <div style="position:absolute; top:0; right:0; background:#009ee3; color:white; font-size:0.7rem; padding:3px 10px; border-bottom-left-radius:8px; font-weight:bold;">MÁS SEGURO</div>
                                </label>
                                
                                <label id="label-efectivo" style="display:flex; align-items:flex-start; gap:1rem; cursor:pointer; padding:1.2rem; border: 1px solid var(--border-color); border-radius:12px; background:#fafafa;">
                                    <input type="radio" name="payment_method" value="efectivo" style="margin-top:0.4rem; transform:scale(1.2);">
                                    <div style="flex:1;">
                                        <strong style="display:block; color:var(--text-color); font-size:1.1rem; margin-bottom:4px;"><i class="fa-solid fa-money-bill-transfer"></i> Efectivo / Transferencia Bancaria</strong>
                                        <span style="font-size:0.85rem; color: var(--text-muted); display:block;">Coordina el pago directamente con nosotros por WhatsApp.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit"`;
html = html.replace(regexPart2, newPart2);

fs.writeFileSync('public/checkout.html', html, 'utf8');
console.log('checkout.html updated.');

// 3. UPDATE SCRIPT.JS TO HANDLE NEW FIELDS
let script = fs.readFileSync('public/script.js', 'utf8');

const oldCollect = /const shipping_address = document\.getElementById\('chk-address'\)\.value \+ ', ' \+ city \+ ' CP: ' \+ document\.getElementById\('chk-zip'\)\.value;/;
const newCollect = `const phone = document.getElementById('chk-phone') ? document.getElementById('chk-phone').value : '';
            const dni = document.getElementById('chk-dni') ? document.getElementById('chk-dni').value : '';
            const shipping_address = \`Tel: \${phone} - DNI: \${dni} - \${document.getElementById('chk-address').value}, \${city} CP: \${document.getElementById('chk-zip').value}\`;`;

script = script.replace(oldCollect, newCollect);

// Update Cache Busting in checkout.html
script = script.replace(/script\.js\?v=\d+/g, 'script.js?v=' + Date.now());

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js updated.');
