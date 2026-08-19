const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');
const adminDarkCss = `
/* Admin & Login Dark Mode Fixes */
body.dark-mode .admin-layout { background-color: var(--bg-color); }
body.dark-mode .admin-sidebar { background: var(--card-bg); border-color: var(--border-color); }
body.dark-mode .admin-sidebar h2, body.dark-mode .admin-sidebar h2 a { color: var(--text-color); }
body.dark-mode .admin-nav a { color: var(--text-color); }
body.dark-mode .admin-nav a:hover, body.dark-mode .admin-nav a.active { background: var(--border-color); }
body.dark-mode .admin-main { background-color: var(--bg-color); }
body.dark-mode .admin-header h3 { color: var(--text-color); }
body.dark-mode .admin-card { background: var(--card-bg) !important; color: var(--text-color); box-shadow: 0 4px 6px rgba(255,255,255,0.02); }
body.dark-mode .admin-card h4 { border-color: var(--border-color); color: var(--text-color); }
body.dark-mode .slide-item { background: var(--gray-bg) !important; border-color: var(--border-color) !important; }
body.dark-mode .slide-info p { color: #aaa; }
body.dark-mode .auth-container { background: var(--card-bg) !important; color: var(--text-color); box-shadow: 0 10px 30px rgba(255,255,255,0.02) !important; }
body.dark-mode .auth-container h2 { color: var(--text-color); }
body.dark-mode .auth-container p { color: #aaa; }
body.dark-mode .stats-grid > div { background: var(--card-bg) !important; border: 1px solid var(--border-color) !important; }

body.dark-mode #theme-toggle { color: #f1c40f !important; }

.admin-sidebar, .admin-card, .admin-main, .auth-container, .slide-item, .stats-grid > div {
    transition: background-color 1s cubic-bezier(0.25, 1, 0.5, 1), border-color 1s ease, color 0.5s ease;
}
`;

if(!css.includes('Admin & Login Dark Mode Fixes')) {
    fs.writeFileSync('public/style.css', css + '\n' + adminDarkCss, 'utf8');
}

// Insert button in admin.html
let adminHtml = fs.readFileSync('public/admin.html', 'utf8');
if (!adminHtml.includes('id="theme-toggle"')) {
    adminHtml = adminHtml.replace(
        /<div class="admin-header">\s*<h3>Panel de Control<\/h3>/,
        `<div class="admin-header">
            <div style="display:flex; align-items:center; gap: 1rem;">
                <h3>Panel de Control</h3>
                <a href="#" id="theme-toggle" title="Cambiar Tema" style="font-size: 1.5rem; color: #111;"><i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i></a>
            </div>`
    );
    fs.writeFileSync('public/admin.html', adminHtml, 'utf8');
}

// Insert button in login.html
let loginHtml = fs.readFileSync('public/login.html', 'utf8');
if (!loginHtml.includes('id="theme-toggle"')) {
    loginHtml = loginHtml.replace(
        /<body>/,
        `<body>
    <a href="#" id="theme-toggle" title="Cambiar Tema" style="position:absolute; top:20px; right:20px; font-size: 1.5rem; color: #111;"><i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i></a>`
    );
    fs.writeFileSync('public/login.html', loginHtml, 'utf8');
}

// Insert button in register.html
let regHtml = fs.readFileSync('public/register.html', 'utf8');
if (!regHtml.includes('id="theme-toggle"')) {
    regHtml = regHtml.replace(
        /<body>/,
        `<body>
    <a href="#" id="theme-toggle" title="Cambiar Tema" style="position:absolute; top:20px; right:20px; font-size: 1.5rem; color: #111;"><i class="fa-solid fa-moon"></i><i class="fa-solid fa-sun"></i></a>`
    );
    fs.writeFileSync('public/register.html', regHtml, 'utf8');
}

// Also wait, does admin.html load script.js?
// If it doesn't, the theme toggle won't work in admin.html!
