const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

// Replace all combinations of stars
s = s.replace(/<i class="fa-solid fa-star"><\/i>/g, '');
s = s.replace(/<i class="fa-solid fa-star-half-stroke"><\/i>/g, '');
s = s.replace(/<i class="fa-regular fa-star"><\/i>/g, '');

// There's a template literal one: <i class="fa-solid fa-star${rating < 4.5 ? '-half-stroke' : ''}"></i>
s = s.replace(/<i class="fa-solid fa-star\$\{rating < 4\.5 \? '-half-stroke' : ''\}"><\/i>/g, '');

// There's also dynamic JS logic that generates starsHtml:
// let starsHtml = '';
// if (i <= Math.floor(avgRating)) starsHtml += '<i class="fa-solid fa-star"></i>';
// ...
// We can just leave that logic, but if we remove the actual output `${starsHtml}`, it's cleaner.
s = s.replace(/\$\{starsHtml\}/g, '');

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Removed stars cleanly without breaking syntax');
