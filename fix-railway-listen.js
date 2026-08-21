const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');

const regex = /if \(process\.env\.NODE_ENV !== 'production' && !process\.env\.VERCEL && !process\.env\.VERCEL_ENV\) \{/g;
const newStr = `if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
    // Railway, Local, or VPS: Start the server on 0.0.0.0 so it's accessible externally`;

if(s.match(regex)) {
    s = s.replace(regex, newStr);
    
    // Also bind to 0.0.0.0 for Railway!
    s = s.replace(/app\.listen\(PORT, \(\) => \{/, "app.listen(PORT, '0.0.0.0', () => {");
    
    fs.writeFileSync('server.js', s, 'utf8');
    console.log('Fixed app.listen for Railway!');
} else {
    console.log('Could not match regex');
}
