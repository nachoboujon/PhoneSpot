const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Remove background from outermost container
s = s.replace(
    '<div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">',
    '<div style="width: 100%; background: #fff; padding: 3rem 0;">'
);

// 2. Remove box-shadow and border from the grid container
s = s.replace(
    /style="display:grid; grid-template-columns:1fr 1\.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2\.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba\(0,0,0,0\.06\);"/,
    'style="display:grid; grid-template-columns:1fr 1fr; gap:4rem; max-width:1200px; margin:0 auto; padding:1rem 2.5rem; background: #fff;"'
);

// 3. Remove gray background from main image box
s = s.replace(
    /style="position: relative; overflow: hidden; border-radius: 16px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 2rem;"/,
    'style="position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 2rem;"'
);

// 4. Clean up the thumbnails
s = s.replace(
    /style="width:70px; height:70px; object-fit:contain; border-radius:10px; cursor:pointer; padding:5px; background:#f5f5f7; border:2px solid #000;"/,
    'style="width:70px; height:70px; object-fit:contain; border-radius:8px; cursor:pointer; padding:5px; background:#fff; border:1px solid #e0e0e0; transition:0.2s;" onmouseover="this.style.borderColor=\'#0071e3\'" onmouseout="this.style.borderColor=\'#e0e0e0\'"'
);

// 5. Remove gray background from the Price box at the bottom, make it just bold text
s = s.replace(
    /<div style="background:#f9f9f9; padding: 1\.2rem; border-radius: 12px; margin-bottom: 1\.5rem; border: 1px solid #eee;">/,
    '<div style="padding: 1rem 0; margin-bottom: 1rem;">'
);
s = s.replace(
    /<p class="price" style="font-size:2\.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">/,
    '<p class="price" style="font-size:2.5rem; font-weight:700; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">'
);

// 6. Make Add to Cart button massive and blue
s = s.replace(
    /<button class="btn add-to-cart-btn" style="flex:1; padding:1\.2rem; font-size:1rem; font-weight:bold; border-radius:12px; /,
    '<button class="btn add-to-cart-btn" style="flex:1; padding:1.2rem; font-size:1.1rem; font-weight:600; border-radius:30px; border:none; '
);

// 7. Remove the "Descripción del producto" heading and just let the text flow, or make it cleaner.
s = s.replace(
    /<div style="padding-top: 1\.5rem; border-top: 1px solid #eee;">\s*<h4 style="font-size: 0\.95rem; margin-bottom: 1rem; color:#1d1d1f;">Descripción del producto<\/h4>/,
    '<div style="padding-top: 2rem; border-top: 1px solid #eee; margin-top:2rem;">'
);

// 8. Make the variants section border-top cleaner
s = s.replace(
    /<div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">/,
    '<div style="margin-bottom:2rem; padding-top: 1rem;" id="variant-selector">'
);


fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Applied flat white Apple style');
