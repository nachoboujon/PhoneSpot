const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const responsiveCSS = `
        /* --- RESPONSIVE FIXES --- */
        @media (max-width: 768px) {
            .admin-layout { flex-direction: column; }
            .admin-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #eaeaea; padding: 1rem; }
            .admin-sidebar h2 { margin-bottom: 1rem; }
            .admin-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; }
            .admin-nav li { margin-bottom: 0; flex: 1; min-width: 120px; }
            .admin-nav a { padding: 0.8rem; text-align: center; font-size: 0.9rem; }
            .admin-main { padding: 1rem; }
            .admin-header { flex-direction: column; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
            .admin-header h3 { font-size: 1.5rem; }
            .admin-card { padding: 1rem; overflow-x: auto; }
            table { min-width: 600px; } /* Prevents tables from squishing */
            
            /* Responsive Modal Forms */
            .modal-content { width: 95%; padding: 1.5rem; margin: 10% auto; }
            .form-row { flex-direction: column; gap: 1rem; }
        }
    </style>
`;

if (!html.includes('/* --- RESPONSIVE FIXES --- */')) {
    html = html.replace('</style>', responsiveCSS);
    fs.writeFileSync('public/admin.html', html, 'utf8');
    console.log('Admin panel responsive CSS injected');
} else {
    console.log('Responsive CSS already present in admin.html');
}
