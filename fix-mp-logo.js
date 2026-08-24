const fs = require('fs');
let html = fs.readFileSync('public/checkout.html', 'utf8');

const oldMpText = /<strong style="display:block; color:#009ee3; font-size:1\.1rem; margin-bottom:4px;">Tarjetas de Débito, Crédito y Mercado Pago<\/strong>[\s\S]*?<\/div>\s*<\/div>/;

const newMpText = `<strong style="display:block; color:#009ee3; font-size:1.1rem; margin-bottom:4px;"><img src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadopago/logo__large.png" style="height:22px; vertical-align:middle; margin-right:8px;"></strong>
                                        <span style="font-size:0.85rem; color: #555; display:block; margin-bottom:8px;">Paga seguro al contado con tu Tarjeta de <b>DÉBITO</b> (Visa, Mastercard, Cabal) o con saldo en tu cuenta.<br><span style="color:#d32f2f; font-size:0.75rem;"><i class="fa-solid fa-ban"></i> Tarjetas de Crédito no aceptadas.</span></span>
                                        <div style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
                                            <i class="fa-brands fa-cc-visa" style="font-size:24px; color:#1a1f71;" title="Visa Débito"></i>
                                            <i class="fa-brands fa-cc-mastercard" style="font-size:24px; color:#eb001b;" title="Mastercard Débito"></i>
                                        </div>
                                    </div>`;

if (oldMpText.test(html)) {
    html = html.replace(oldMpText, newMpText);
    fs.writeFileSync('public/checkout.html', html, 'utf8');
    console.log('Fixed MP logo and text in checkout.html');
} else {
    console.log('Regex failed');
}
