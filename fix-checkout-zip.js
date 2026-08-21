const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badChunk = `    const citySelect = document.getElementById('chk-city');
    if (citySelect && citySelect.value === 'Otra') {
        const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
        if (selectedShipping) {
            shippingCost = selectedShipping.value === 'andreani' 
                ? (settings.shipping_andreani || 12000) 
                : (settings.shipping_correo || 8500);
            
            if (isFreeShipping) {
                shippingCost = 0;
            }`;

const goodChunk = `    const citySelect = document.getElementById('chk-city');
    const zipInput = document.getElementById('chk-zip');
    const userZip = zipInput ? zipInput.value.trim() : '';
    
    if (citySelect && citySelect.value === 'Otra') {
        const selectedShipping = document.querySelector('input[name="shipping_method"]:checked');
        if (selectedShipping) {
            shippingCost = selectedShipping.value === 'andreani' 
                ? (settings.shipping_andreani || 12000) 
                : (settings.shipping_correo || 8500);
            
            // Envío local sin cargo
            if (userZip === '3283' || userZip === '3280') {
                shippingCost = 0;
            } else if (isFreeShipping) {
                shippingCost = 0;
            }`;

if (s.includes(badChunk)) {
    s = s.replace(badChunk, goodChunk);
    
    // Add event listener for chk-zip
    const listenerChunk = `        if (shippingRadios.length > 0) {
            shippingRadios.forEach(r => r.addEventListener('change', renderCheckout));
        }`;
    const newListenerChunk = `        if (shippingRadios.length > 0) {
            shippingRadios.forEach(r => r.addEventListener('change', renderCheckout));
        }
        
        const zipInput = document.getElementById('chk-zip');
        if (zipInput) {
            zipInput.addEventListener('input', renderCheckout);
        }`;
    s = s.replace(listenerChunk, newListenerChunk);
    
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed checkout shipping logic');
} else {
    console.log('Not found');
}
