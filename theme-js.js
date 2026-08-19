const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const logic = `
// ==================== TEMA (MODO OSCURO/CLARO) ====================
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Cargar preferencia
        const currentTheme = localStorage.getItem('phoneSpotTheme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('phoneSpotTheme', 'dark');
            } else {
                localStorage.setItem('phoneSpotTheme', 'light');
            }
        });
    }
});
`;

fs.writeFileSync('public/script.js', s + '\n' + logic, 'utf8');
