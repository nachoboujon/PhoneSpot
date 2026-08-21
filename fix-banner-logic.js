const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

const oldMarquee = /const marqueeSpan = document\.querySelector\('\.top-banner \.scrolling-text span'\);\s*if \(marqueeSpan && data\.top_banner\) \{\s*marqueeSpan\.innerText = data\.top_banner;\s*\}/;

const newMarquee = `const topBannerDiv = document.querySelector('.top-banner');
        if (topBannerDiv) {
            if (data.top_banner && data.top_banner.trim() !== '') {
                topBannerDiv.style.display = 'block';
                const marqueeSpans = document.querySelectorAll('.top-banner .scrolling-text span');
                marqueeSpans.forEach(span => span.innerText = data.top_banner);
            } else {
                // Si esta vacio, lo ocultamos
                topBannerDiv.style.display = 'none';
            }
        }`;

if(s.match(oldMarquee)){
    s = s.replace(oldMarquee, newMarquee);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed marquee banner behavior');
} else {
    console.log('Could not find marquee regex');
}
