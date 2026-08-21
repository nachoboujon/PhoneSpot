const fs = require('fs');

// 1. UPDATE ADMIN.HTML
let html = fs.readFileSync('public/admin.html', 'utf8');
const regexOldHtml = /<div class="form-group">\s*<label>Texto Promocional \(Arriba del todo\)<\/label>\s*<input type="text" id="set-banner" placeholder="Ej: 🔥 ENVÍO GRATIS EN COMPRAS SUPERIORES A \$1000">\s*<\/div>/;

const newHtml = `<div class="form-group">
                            <label>Mensajes de la Cinta Superior</label>
                            <div id="banner-messages-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                            <button type="button" class="btn" style="background: #e5e5ea; color: #333; margin-top:10px;" onclick="addBannerMessage()"><i class="fa-solid fa-plus"></i> Añadir Mensaje</button>
                        </div>`;

html = html.replace(regexOldHtml, newHtml);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Admin HTML updated.');

// 2. UPDATE SCRIPT.JS (load/save/render logic)
let script = fs.readFileSync('public/script.js', 'utf8');

// A. Remove old load logic:
// if(document.getElementById('set-banner')) { document.getElementById('set-banner').value = currentSettings.top_banner || ''; }
script = script.replace(/if\(document\.getElementById\('set-banner'\)\) \{\s*document\.getElementById\('set-banner'\)\.value = currentSettings\.top_banner \|\| '';\s*\}/, `window.renderBannerMessages();`);

// B. Add JS functions for the banner list
const jsFunctions = `
            window.renderBannerMessages = () => {
                const list = document.getElementById('banner-messages-list');
                if(!list) return;
                let banners = currentSettings.top_banner;
                if (!Array.isArray(banners)) {
                    banners = typeof banners === 'string' && banners.trim() !== '' ? [banners] : [];
                    currentSettings.top_banner = banners;
                }
                list.innerHTML = banners.map((b, i) => \`
                    <div style="display:flex; gap:10px;">
                        <input type="text" value="\${b.replace(/"/g, '&quot;')}" onchange="updateBannerMessage(\${i}, this.value)" style="flex:1;">
                        <button type="button" onclick="removeBannerMessage(\${i})" style="background:#ff4757; color:white; border:none; padding:0 15px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                \`).join('');
            };
            window.addBannerMessage = () => {
                if(!Array.isArray(currentSettings.top_banner)) currentSettings.top_banner = [];
                currentSettings.top_banner.push('');
                window.renderBannerMessages();
            };
            window.updateBannerMessage = (i, val) => {
                currentSettings.top_banner[i] = val;
            };
            window.removeBannerMessage = (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
            };
`;
// Insert jsFunctions after `let currentSettings = ...` in loadAdminSettings
script = script.replace(/let currentSettings = \{.*?top_banner:.*?\};/, match => match + jsFunctions);

// C. Remove old save logic:
// currentSettings.top_banner = document.getElementById('set-banner').value;
script = script.replace(/currentSettings\.top_banner = document\.getElementById\('set-banner'\)\.value;/, `// top_banner ya se actualiza en tiempo real con updateBannerMessage()`);

// D. Fix applyFrontendSettings (rendering logic for multiple strings)
const oldApply = /const topBannerDiv = document\.querySelector\('\.top-banner'\);\s*if \(topBannerDiv\) \{[\s\S]*?\/\/\s*Si esta vacio, lo ocultamos[\s\S]*?topBannerDiv\.style\.display = 'none';\s*\}\s*\}/;

const newApply = `const topBannerDiv = document.querySelector('.top-banner');
        if (topBannerDiv) {
            let banners = data.top_banner;
            if (!Array.isArray(banners)) {
                banners = typeof banners === 'string' && banners.trim() !== '' ? [banners] : [];
            }
            // Filter out empty strings
            banners = banners.filter(b => b.trim() !== '');
            
            if (banners.length > 0) {
                topBannerDiv.style.display = 'block';
                const container = document.querySelector('.top-banner .scrolling-text');
                if (container) {
                    // Create enough repetitions for infinite scroll
                    const contentHtml = banners.map(b => \`<span>\${b}</span>\`).join('');
                    // Repetimos 4 veces para asegurar que llene toda la pantalla y no se corte
                    container.innerHTML = contentHtml + contentHtml + contentHtml + contentHtml;
                }
            } else {
                topBannerDiv.style.display = 'none';
            }
        }`;

script = script.replace(oldApply, newApply);

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Script updated successfully.');
