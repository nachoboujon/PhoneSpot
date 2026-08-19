const fs = require('fs');

const sidebarHtml = `
    <!-- FAVORITES SIDEBAR -->
    <div id="fav-sidebar-overlay" onclick="toggleFavSidebar()" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1050; opacity: 0; visibility: hidden; transition: 0.3s;"></div>
    <div id="fav-sidebar" style="position: fixed; top: 0; right: -400px; width: 100%; max-width: 400px; height: 100vh; background: var(--bg-color); z-index: 1100; box-shadow: -5px 0 15px rgba(0,0,0,0.1); transition: right 0.3s ease; display: flex; flex-direction: column;">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--card-bg);">
            <h3 style="margin: 0; color: var(--text-color); font-size: 1.5rem;"><i class="fa-solid fa-heart" style="color: #ff4757; margin-right: 10px;"></i> Mis Favoritos</h3>
            <button onclick="toggleFavSidebar()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-color); cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="fav-sidebar-items" style="flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            <!-- Renderizado por JS -->
        </div>
    </div>
`;

const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));

files.forEach(f => {
    let s = fs.readFileSync('public/' + f, 'utf8');
    
    // Add sidebar before closing body
    if (!s.includes('fav-sidebar')) {
        s = s.replace(/<\/body>/, sidebarHtml + '\n</body>');
    }

    // Change the heart icon in header to open sidebar
    s = s.replace(/href="perfil\.html#favoritos"[^>]*>/g, 'href="#" onclick="event.preventDefault(); toggleFavSidebar();" title="Mis Favoritos" style="margin-right: 15px; font-size: 1.2rem; color: var(--text-color);">');
    
    fs.writeFileSync('public/' + f, s, 'utf8');
});

console.log('Sidebar injected into all HTML files!');
