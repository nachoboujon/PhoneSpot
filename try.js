const fs = require('fs');
let s = fs.readFileSync('public/style.css', 'utf8');

const darkOverride = `
/* =================== TEXT VISIBILITY OVERRIDES FOR DARK MODE =================== */
body.dark-mode h1, 
body.dark-mode h2, 
body.dark-mode h3, 
body.dark-mode h4, 
body.dark-mode h5, 
body.dark-mode h6, 
body.dark-mode p, 
body.dark-mode span, 
body.dark-mode div,
body.dark-mode li,
body.dark-mode strong,
body.dark-mode small {
    color: var(--text-color) !important;
}

/* Except specific colored elements like badges, errors, warnings */
body.dark-mode .badge, 
body.dark-mode .btn,
body.dark-mode button,
body.dark-mode .fa-check-circle,
body.dark-mode .fa-xmark,
body.dark-mode .fa-clock,
body.dark-mode .fa-truck-fast,
body.dark-mode .fa-heart,
body.dark-mode [style*="color: red"],
body.dark-mode [style*="color:red"],
body.dark-mode [style*="color: #e74c3c"],
body.dark-mode [style*="color: #e67e22"],
body.dark-mode [style*="color: #2e8b57"],
body.dark-mode [style*="color: #f1c40f"],
body.dark-mode [style*="color: #3498db"],
body.dark-mode [style*="color:#ff4757"],
body.dark-mode [style*="color:#2e8b57"] {
    color: inherit; 
    /* Or just let them be, but we need to undo the !important above for them */
}
`;

// Wait, applying !important to ALL spans and divs will destroy button colors, warning colors, etc!
