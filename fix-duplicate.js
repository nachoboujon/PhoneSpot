const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badChunk = `                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = \`https://wa.me/\${wpPhone}?text=\${encodeURIComponent(wpMsg)}\`;
                        cart = [];
                        saveCart();
                        if (typeof updateCartUI === 'function') updateCartUI();

                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = \`https://wa.me/\${wpPhone}?text=\${encodeURIComponent(wpMsg)}\`;
                        cart = [];
                        saveCart();
                        updateCartUI();`;

const goodChunk = `                        const wpPhone = window.phoneSpotSettings?.whatsapp_number || '5493447416011';
                        const wpUrl = \`https://wa.me/\${wpPhone}?text=\${encodeURIComponent(wpMsg)}\`;
                        cart = [];
                        saveCart();
                        if (typeof updateCartUI === 'function') updateCartUI();`;

if (s.includes(badChunk)) {
    s = s.replace(badChunk, goodChunk);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed duplicated block!');
} else {
    // maybe spacing is different. I'll just remove the second declaration.
    s = s.replace(/const wpPhone = window\.phoneSpotSettings\?\.whatsapp_number[^;]*;/g, 'var wpPhone = window.phoneSpotSettings?.whatsapp_number || "5493447416011";');
    s = s.replace(/const wpUrl = /g, 'var wpUrl = ');
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed via var conversion');
}
