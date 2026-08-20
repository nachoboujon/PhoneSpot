const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. In renderCheckout, when generating wpUrl, use settings.whatsapp_number
s = s.replace(
    /const wpUrl = `https:\/\/wa\.me\/5493447416011\?text=\$\{encodeURIComponent\(wpMsg\)\}`; \/\/ El admin pondrá su num/,
    "const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';\n                        const wpUrl = `https://wa.me/${wpPhone}?text=${encodeURIComponent(wpMsg)}`;"
);

// 2. In loadAdminData, load the WA number and coupons
const loadAdminInject = `
    const waInput = document.getElementById('set-whatsapp-num');
    if (waInput && currentSettings.whatsapp_number) waInput.value = currentSettings.whatsapp_number;
    window.renderAdminCoupons();
`;
s = s.replace(/document\.getElementById\('set-free-shipping'\)\.value = currentSettings\.free_shipping_threshold \|\| 1500000;/, "document.getElementById('set-free-shipping').value = currentSettings.free_shipping_threshold || 1500000;\n" + loadAdminInject);

// 3. Admin forms for WA and Coupons
const adminFormsInject = `
    const waForm = document.getElementById('admin-whatsapp-form');
    if (waForm) {
        waForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            currentSettings.whatsapp_number = document.getElementById('set-whatsapp-num').value.replace(/[^0-9]/g, '');
            await saveSettings(currentSettings);
            showToast('Número de WhatsApp guardado', 'fa-check');
        });
    }

    const couponForm = document.getElementById('admin-coupon-form');
    if (couponForm) {
        window.renderAdminCoupons = () => {
            const list = document.getElementById('coupons-list');
            if (!list) return;
            const coupons = currentSettings.coupons || [];
            list.innerHTML = coupons.map((c, i) => \`
                <div style="background: var(--gray-bg); padding: 0.5rem 1rem; border-radius: 20px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.5rem;">
                    <strong>\${c.code}</strong> 
                    <span style="font-size: 0.8rem; color: var(--text-muted);">(\${c.type === 'shipping' ? 'Envío' : c.value})</span>
                    <i class="fa-solid fa-times" style="cursor: pointer; color: #ff4757;" onclick="deleteCoupon(\${i})"></i>
                </div>
            \`).join('');
        };

        window.deleteCoupon = async (index) => {
            currentSettings.coupons.splice(index, 1);
            await saveSettings(currentSettings);
            window.renderAdminCoupons();
        };

        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentSettings.coupons) currentSettings.coupons = [];
            currentSettings.coupons.push({
                code: document.getElementById('add-coupon-code').value.trim().toUpperCase(),
                type: document.getElementById('add-coupon-type').value,
                value: Number(document.getElementById('add-coupon-value').value)
            });
            await saveSettings(currentSettings);
            couponForm.reset();
            window.renderAdminCoupons();
            showToast('Cupón agregado', 'fa-check');
        });
    }
`;
s = s.replace(/const bannerForm = document\.getElementById\('admin-banner-form'\);/, adminFormsInject + '\n    const bannerForm = document.getElementById(\'admin-banner-form\');');

// 4. In window.applyCoupon, use the dynamic settings
s = s.replace(
    /const coupons = settings\.coupons \|\| \[[^\]]+\];/,
    "const coupons = settings.coupons || [];"
);

// 5. When paymentMethod === 'mercadopago', call backend to generate preference!
const mpInject = `
                        showToast('Redirigiendo a Mercado Pago...', 'fa-spinner fa-spin');
                        // Call MP endpoint
                        try {
                            const mpRes = await fetch('http://localhost:3000/api/mercadopago/preference', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ items: cart, customer_email, total_ars: Math.round(orderTotal * window.dolarValue) })
                            });
                            const mpData = await mpRes.json();
                            if (mpData.init_point) {
                                cart = [];
                                saveCart();
                                window.location.href = mpData.init_point;
                            } else {
                                showToast('Aviso: El admin debe colocar su MP_ACCESS_TOKEN en el archivo .env', 'fa-triangle-exclamation');
                            }
                        } catch(e) {
                            showToast('Error conectando con MP', 'fa-times');
                        }
`;

// Replace the existing mercadopago block
s = s.replace(
    /\/\/ Mercado pago token no configurado[\s\S]+?\}\s+\}\s+else\s+\{/g,
    mpInject + "\n                    }\n                } else {"
);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Modified script.js for MP, WA, Coupons');
