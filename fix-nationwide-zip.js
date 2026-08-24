const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

const hook = `if (zipCityMap[zip]) {
                    chkCity.value = zipCityMap[zip];
                } else if (zip.length >= 4) {
                    // Si no es local pero es un CP válido, dejamos que el usuario escriba la ciudad o la busque si se conectara una API.
                    // Podríamos limpiar la ciudad si queremos obligarlo a tipear, pero mejor dejar lo que tenga.
                }`;

const newZipLogic = `if (zipCityMap[zip]) {
                    chkCity.value = zipCityMap[zip];
                } else if (zip.length >= 4) {
                    // Buscar en toda Argentina con Zippopotamus
                    chkCity.value = 'Buscando ciudad...';
                    fetch('https://api.zippopotam.us/ar/' + zip)
                        .then(res => res.json())
                        .then(data => {
                            if (data.places && data.places.length > 0) {
                                // Capitalizar la ciudad
                                const place = data.places[0]['place name'];
                                const state = data.places[0]['state'];
                                const cityFormatted = place.toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                const stateFormatted = state.toLowerCase().replace(/(^|\\s)\\S/g, l => l.toUpperCase());
                                chkCity.value = cityFormatted + ', ' + stateFormatted;
                            } else {
                                chkCity.value = '';
                                chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                            }
                        })
                        .catch(() => {
                            chkCity.value = '';
                            chkCity.placeholder = 'Ingresa tu ciudad manualmente';
                        });
                }`;

if (script.includes(hook)) {
    script = script.replace(hook, newZipLogic);
    fs.writeFileSync('public/script.js', script, 'utf8');
    console.log('Added nationwide Zippopotamus API to zip logic');
} else {
    console.log('Hook not found, attempting fallback replacement');
    // Fallback if the previous exact string doesn't match
    const fallbackRegex = /if \(zipCityMap\[zip\]\) \{[\s\S]*?\/\/ Podríamos limpiar la ciudad si queremos obligarlo a tipear, pero mejor dejar lo que tenga.\n                \}/;
    if (fallbackRegex.test(script)) {
        script = script.replace(fallbackRegex, newZipLogic);
        fs.writeFileSync('public/script.js', script, 'utf8');
        console.log('Fallback replacement succeeded');
    } else {
        console.log('Fallback failed');
    }
}
