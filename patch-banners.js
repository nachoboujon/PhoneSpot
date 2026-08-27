const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target1 = `            window.updateBannerMessage = (i, val) => {
                currentSettings.top_banner[i] = val;
            };
            window.removeBannerMessage = (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
            };`;

const repl1 = `            window.updateBannerMessage = (i, val) => {
                currentSettings.top_banner[i] = val;
            };
            window.removeBannerMessage = async (i) => {
                currentSettings.top_banner.splice(i, 1);
                window.renderBannerMessages();
                await window.saveSettingsFunc(); // auto save
            };`;

const target2 = `            if(bannerForm) {
                bannerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    // top_banner ya se actualiza en tiempo real con updateBannerMessage()
                if(document.getElementById('set-flash-date')) {
                    currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                }
                if(document.getElementById('set-brands-list')) {
                    currentSettings.brands_list = document.getElementById('set-brands-list').value;
                }
                    saveSettings();
                });
            }`;

const repl2 = `            if(bannerForm) {
                bannerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    // Extraer los mensajes del banner en el momento del submit para evitar bugs de onchange
                    const listContainer = document.getElementById('banner-messages-list');
                    if (listContainer) {
                        const inputs = listContainer.querySelectorAll('input[type="text"]');
                        currentSettings.top_banner = Array.from(inputs).map(inp => inp.value);
                    }

                    if(document.getElementById('set-flash-date')) {
                        currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                    }
                    if(document.getElementById('set-brands-list')) {
                        currentSettings.brands_list = document.getElementById('set-brands-list').value;
                    }
                    window.saveSettingsFunc();
                });
            }`;

const target3 = `            const saveSettings = async () => {`;
const repl3 = `            window.saveSettingsFunc = async () => {
                const token = localStorage.getItem('phoneSpotToken');
                showToast('Guardando...', 'fa-spinner fa-spin');
                try {
                    const res = await fetch(window.API_URL + '/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                        body: JSON.stringify(currentSettings)
                    });
                    if (res.ok) showToast('Guardado correctamente', 'fa-check');
                    else showToast('Error al guardar', 'fa-triangle-exclamation');
                } catch(e) { showToast('Error de conexión', 'fa-triangle-exclamation'); }
            };
            const saveSettings = async () => { await window.saveSettingsFunc(); };`;

s = s.replace(target1, repl1);
s = s.replace(target2, repl2);
s = s.replace(target3, repl3);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Patched top banners!');
