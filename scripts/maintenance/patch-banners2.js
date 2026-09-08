const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const target = `            window.saveSettingsFunc = async () => {
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
            const saveSettings = async () => { await window.saveSettingsFunc(); };
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
            };`;

const repl = `            window.saveSettingsFunc = async () => {
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

s = s.replace(target, repl);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed duplication!');
