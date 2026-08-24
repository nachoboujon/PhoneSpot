const fs = require('fs');
let html = fs.readFileSync('public/catalogo.html', 'utf8');

const responsiveFix = `
        /* --- MOBILE RESPONSIVE FIXES --- */
        @media (max-width: 1024px) {
            #filters-sidebar {
                flex: none !important;
                width: 100% !important;
                position: relative !important;
                top: 0 !important;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 1rem !important;
                margin-bottom: 2rem;
            }
            .catalog-container {
                flex-direction: column !important;
                padding: 1rem !important;
            }
            #full-catalog-container {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
                gap: 1rem !important;
            }
        }
        
        @media (max-width: 480px) {
            #catalog-title { font-size: 2rem !important; }
            .product-card img { height: 180px !important; }
            .product-card h3 { font-size: 1rem !important; }
            .product-card .price { font-size: 1.2rem !important; }
        }
    </style>
`;

if (!html.includes('/* --- MOBILE RESPONSIVE FIXES --- */')) {
    html = html.replace('</style>', responsiveFix);
    fs.writeFileSync('public/catalogo.html', html, 'utf8');
    console.log('Mobile fixes injected into catalogo.html');
}
