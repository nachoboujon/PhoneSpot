const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Reverse fix-flat-white
s = s.replace('<div style="width: 100%; background: #fff; padding: 3rem 0;">', '<div style="width: 100%; background: #fbfbfd; padding: 3rem 0;">');
s = s.replace('style="display:grid; grid-template-columns:1fr 1fr; gap:4rem; max-width:1200px; margin:0 auto; padding:1rem 2.5rem; background: #fff;"', 'style="display:grid; grid-template-columns:1fr 1.1fr; gap:3rem; max-width:1100px; margin:0 auto; padding:2.5rem; background: #fff; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.06);"');
s = s.replace('style="position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 2rem;"', 'style="position: relative; overflow: hidden; border-radius: 16px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 2rem;"');
s = s.replace('style="width:70px; height:70px; object-fit:contain; border-radius:8px; cursor:pointer; padding:5px; background:#fff; border:1px solid #e0e0e0; transition:0.2s;" onmouseover="this.style.borderColor=\'#0071e3\'" onmouseout="this.style.borderColor=\'#e0e0e0\'"', 'style="width:70px; height:70px; object-fit:contain; border-radius:10px; cursor:pointer; padding:5px; background:#f5f5f7; border:2px solid #000;"');

// Price
s = s.replace('<div style="padding: 1rem 0; margin-bottom: 1rem;">', '<div style="background:#f9f9f9; padding: 1.2rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #eee;">');
s = s.replace('<p class="price" style="font-size:2.5rem; font-weight:700; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">', '<p class="price" style="font-size:2.2rem; font-weight:bold; color: #1d1d1f; margin-bottom:0; letter-spacing:-1px;">');

// Add to Cart
s = s.replace('border-radius:30px; border:none; ', 'border-radius:12px; ');

// Desc
s = s.replace('<div style="padding-top: 2rem; border-top: 1px solid #eee; margin-top:2rem;">', '<div style="padding-top: 1.5rem; border-top: 1px solid #eee;">\n                                    <h4 style="font-size: 0.95rem; margin-bottom: 1rem; color:#1d1d1f;">Descripción del producto</h4>');

// Variants section
s = s.replace('<div style="margin-bottom:2rem; padding-top: 1rem;" id="variant-selector">', '<div style="margin-bottom:2rem; border-top: 1px solid #eee; padding-top: 2rem;" id="variant-selector">');

// Reverse fix-layout-apple.js
s = s.replace('class="product-gallery" style="display:flex; flex-direction:column; gap:1rem; position: sticky; top: 100px; height: max-content; align-self: start;"', 'class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;"');
s = s.replace('class="product-gallery" style="display:flex; flex-direction:column; gap:1rem; position: sticky; top: 100px; height: max-content;"', 'class="product-gallery" style="display:flex; flex-direction:column; gap:1rem;"'); // fallback

// Reverse the price move
const priceBlockRegex = /<div style="background:#f9f9f9; padding: 1\.2rem; border-radius: 12px; margin-bottom: 1\.5rem; border: 1px solid #eee;">[\s\S]*?\/ Final ARS<\/span><\/p>\s*<\/div>/;
const priceMatch = s.match(priceBlockRegex);
if(priceMatch) {
    const priceHTML = priceMatch[0];
    s = s.replace(priceHTML, '');
    const ratingRegex = /<div class="product-rating"[^>]*>[\s\S]*?<\/div>/;
    s = s.replace(ratingRegex, match => match + '\n                                ' + priceHTML);
}

// Title size
s = s.replace('font-size:3rem; font-weight:700; letter-spacing: -1px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;', 'font-size:2.4rem; font-weight:800;');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Reverted layout completely');
