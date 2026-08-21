const fs = require('fs');

['public/login.html', 'public/register.html'].forEach(file => {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/<a href="(register\.html|login\.html)">/g, '<a href="$1" id="auth-switch-link">');
    fs.writeFileSync(file, html, 'utf8');
});

let script = fs.readFileSync('public/script.js', 'utf8');
const preserveParams = `
// Preserve Auth Redirect params
window.addEventListener('DOMContentLoaded', () => {
    const authLink = document.getElementById('auth-switch-link');
    if (authLink) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        if (redirect) {
            authLink.href = authLink.getAttribute('href') + '?redirect=' + redirect;
        }
    }
});
`;
if (!script.includes('auth-switch-link')) {
    script += '\n' + preserveParams;
    fs.writeFileSync('public/script.js', script, 'utf8');
}
console.log('Query params preserved');
