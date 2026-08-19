const fs = require('fs');

let s = fs.readFileSync('public/script.js', 'utf8');

// 1. Update loadAdminSettings
s = s.replace(/if\(document\.getElementById\('set-banner'\)\) \{[^}]+\}/, `if(document.getElementById('set-banner')) {
                        document.getElementById('set-banner').value = currentSettings.top_banner || '';
                    }
                    if(document.getElementById('set-flash-date')) {
                        document.getElementById('set-flash-date').value = currentSettings.flash_end_date || '';
                    }`);

// 2. Update Admin save function
s = s.replace(/currentSettings\.top_banner = document\.getElementById\('set-banner'\)\.value;/, `currentSettings.top_banner = document.getElementById('set-banner').value;
                if(document.getElementById('set-flash-date')) {
                    currentSettings.flash_end_date = document.getElementById('set-flash-date').value;
                }`);

// 3. Add Countdown JS logic at the end
const countdownLogic = `
// ==================== CUENTA REGRESIVA DE OFERTAS ====================
window.initFlashCountdown = () => {
    const cdContainer = document.getElementById('flash-countdown');
    if (!cdContainer) return;
    
    // Obtener fecha final desde la DB o usar un fallback de 3 días si no hay
    let endDateStr = window.phoneSpotSettings?.flash_end_date;
    if (!endDateStr) {
        // Fallback: 3 days from now
        const d = new Date();
        d.setDate(d.getDate() + 3);
        endDateStr = d.toISOString();
    }
    
    const endDate = new Date(endDateStr).getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = endDate - now;
        
        if (distance < 0) {
            cdContainer.style.display = 'none';
            return;
        }
        
        cdContainer.style.display = 'flex';
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if(document.getElementById('cd-days')) document.getElementById('cd-days').innerText = days.toString().padStart(2, '0');
        if(document.getElementById('cd-hours')) document.getElementById('cd-hours').innerText = hours.toString().padStart(2, '0');
        if(document.getElementById('cd-mins')) document.getElementById('cd-mins').innerText = minutes.toString().padStart(2, '0');
        if(document.getElementById('cd-secs')) document.getElementById('cd-secs').innerText = seconds.toString().padStart(2, '0');
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
};

// Start countdown once frontend settings are applied
document.addEventListener('DOMContentLoaded', () => {
    // Note: It's better to call it after applyFrontendSettings completes.
    // I will hook into it.
});
`;

if (!s.includes('CUENTA REGRESIVA DE OFERTAS')) {
    s = s + '\n' + countdownLogic;
    s = s.replace(/window\.initHeroCarousel\(\);/, 'window.initHeroCarousel();\n                    if(window.initFlashCountdown) window.initFlashCountdown();');
}

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Script updated with countdown logic!');
