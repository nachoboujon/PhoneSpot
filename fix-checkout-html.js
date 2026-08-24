const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

// Replace the hardcoded shipping radios with the dynamic container
const oldShippingRegex = /<h4 style="margin-top:1\.5rem; margin-bottom:1rem; font-size:1\.1rem; color:#555;">Método de Envío<\/h4>[\s\S]*?<\/div>\s*<\/div>\s*<button type="button" class="btn" onclick="nextCheckoutStep\(\)"/;

const newShippingHTML = `<h4 style="margin-top:1.5rem; margin-bottom:1rem; font-size:1.1rem; color:#555;">Método de Envío</h4>
                            <div id="shipping-options-container" style="display:flex; flex-direction:column; gap:0.8rem; background: #f9f9f9; padding: 1rem; border-radius: 8px; border: 1px dashed #ccc;">
                                <span style="color:#666; font-size:0.9rem;"><i class="fa-solid fa-circle-info"></i> Ingresa tu Código Postal arriba para ver las opciones de envío disponibles para tu zona.</span>
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="nextCheckoutStep()"`;

if (oldShippingRegex.test(html)) {
    html = html.replace(oldShippingRegex, newShippingHTML);
    fs.writeFileSync('public/checkout.html', html, 'utf8');
    console.log('Fixed checkout.html shipping HTML');
} else {
    console.log('Regex failed for checkout.html');
}
