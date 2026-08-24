const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const newListener = `chkZip.addEventListener('input', async (e) => {
                const zip = e.target.value.trim();
                
                // Mapa automático de CP a Ciudades locales
                const zipCityMap = {
                    '3283': 'San José',
                    '3280': 'Colón',
                    '3265': 'Villa Elisa',
                    '3260': 'Concepción del Uruguay'
                };
                
                if (zipCityMap[zip]) {
                    chkCity.value = zipCityMap[zip];
                } else if (zip.length >= 4) {
                    // Buscar en toda Argentina con Zippopotamus
                    chkCity.value = 'Buscando ciudad...';
                    
                    if (!chkCity.getAttribute('list')) {
                        chkCity.setAttribute('list', 'city-options');
                        let dl = document.createElement('datalist');
                        dl.id = 'city-options';
                        chkCity.parentNode.appendChild(dl);
                    }
                    
                    fetch('https://api.zippopotam.us/ar/' + zip)
                        .then(res => res.json())
                        .then(data => {
                            if (data.places && data.places.length > 0) {
                                const dl = document.getElementById('city-options');
                                dl.innerHTML = ''; 
                                
                                data.places.forEach(placeObj => {
                                    const placeName = placeObj['place name'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                    const stateName = placeObj['state'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                    const fullString = placeName + ', ' + stateName;
                                    
                                    let option = document.createElement('option');
                                    option.value = fullString;
                                    dl.appendChild(option);
                                });
                                
                                if (data.places.length === 1) {
                                    chkCity.value = data.places[0]['place name'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase()) + ', ' + data.places[0]['state'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                } else {
                                    chkCity.value = '';
                                    chkCity.placeholder = 'Elige tu ciudad/barrio de la lista...';
                                    chkCity.focus();
                                }
                            } else {
                                chkCity.value = '';
                                chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                            }
                        })
                        .catch(() => {
                            chkCity.value = '';
                            chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                        });
                }

                if (zip.length >= 4) {
                    shippingContainer.innerHTML = \`
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid var(--border-color); padding: 10px; border-radius: 8px; background: #fff;">
                            <input type="radio" name="shipping_method" value="coordinar" data-cost="0" data-name="Envío a Coordinar" style="accent-color: var(--text-color);" checked>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: var(--text-color);">Envío a Coordinar</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Coordinaremos el método de envío y el costo exacto por WhatsApp.</div>
                            </div>
                            <div style="font-weight: bold; color: var(--text-color);">
                                A confirmar
                            </div>
                        </label>
                    \`;
                    
                    document.querySelectorAll('input[name="shipping_method"]').forEach(radio => {
                        radio.addEventListener('change', renderCheckout);
                    });
                    
                    if(typeof renderCheckout === 'function') renderCheckout();
                }
            });
        }`;

const startIndex = script.indexOf("chkZip.addEventListener('input', async (e) => {");
const endIndex = script.indexOf("const checkoutForm = document.getElementById('checkout-form');");

if (startIndex !== -1 && endIndex !== -1) {
    script = script.substring(0, startIndex) + newListener + '\n\n' + script.substring(endIndex);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Fixed script.js successfully');
} else {
    console.log('Failed to find indices');
}
