const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badLine = "window.API_URL = window.API_URL + '';";
const goodLine = "window.API_URL = 'http://localhost:3000';";

if (s.includes(badLine)) {
    s = s.replace(badLine, goodLine);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed API_URL configuration');
} else {
    console.log('Not found');
}
