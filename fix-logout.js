const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const logoutLogic = `
    const globalLogoutBtn = document.getElementById('logout-btn') || document.getElementById('btn-logout');
    if (globalLogoutBtn) {
        globalLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('phoneSpotToken');
            localStorage.removeItem('phoneSpotRole');
            window.location.href = 'index.html';
        });
    }
`;

s = s.replace(/document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/, "document.addEventListener('DOMContentLoaded', () => {\n" + logoutLogic);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Logout logic added.');
