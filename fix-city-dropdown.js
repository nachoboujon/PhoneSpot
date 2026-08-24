const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const hook = `chkCity.value = 'Buscando ciudad...';`;

// We will inject the datalist creation logic. 
// Zippopotamus returns an array of places. We will create or update a datalist.
const newZipLogic = `chkCity.value = 'Buscando ciudad...';
                    
                    // Asegurarnos de que el input tenga un datalist asociado
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
                                dl.innerHTML = ''; // Limpiar opciones anteriores
                                
                                data.places.forEach(placeObj => {
                                    const placeName = placeObj['place name'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                    const stateName = placeObj['state'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                    const fullString = placeName + ', ' + stateName;
                                    
                                    let option = document.createElement('option');
                                    option.value = fullString;
                                    dl.appendChild(option);
                                });
                                
                                // Si solo hay 1 opción, la autocompletamos. Si hay varias, borramos el texto para que despliegue la lista.
                                if (data.places.length === 1) {
                                    chkCity.value = data.places[0]['place name'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase()) + ', ' + data.places[0]['state'].toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                } else {
                                    chkCity.value = '';
                                    chkCity.placeholder = 'Elige tu ciudad/barrio de la lista...';
                                    chkCity.focus(); // Abrir el dropdown (depende del navegador)
                                }
                            } else {
                                chkCity.value = '';
                                chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                            }
                        })
                        .catch(() => {
                            chkCity.value = '';
                            chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                        });`;

const regex = /chkCity\.value = 'Buscando ciudad\.\.\.';[\s\S]*?\}\);/m;

if (regex.test(script)) {
    script = script.replace(regex, newZipLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Added datalist dropdown for cities');
} else {
    console.log('Regex failed');
}
