const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const regex = /<div class="carousel-dots">[\s\S]*?<\/div>/;

if (html.match(regex)) {
    html = html.replace(regex, '');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Dots removed successfully.");
} else {
    console.log("Regex did not match.");
}
