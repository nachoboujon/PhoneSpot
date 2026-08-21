const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const regexAPI = /window\.API_URL = 'http:\/\/localhost:3000';/;
const newAPI = `window.API_URL = '';`; // Empty string for same-domain API calls

if (s.match(regexAPI)) {
    s = s.replace(regexAPI, newAPI);
    fs.writeFileSync('public/script.js', s, 'utf8');
    console.log('Fixed API_URL to work in production!');
} else {
    console.log('Could not find API_URL');
}
