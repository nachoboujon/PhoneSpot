const fs = require('fs');
let script = fs.readFileSync('public/script.js', 'utf8');

// 1. Guard for checkout.html directly
const authGuard = `
// ==================== AUTH GUARD ====================
if (window.location.pathname.includes('checkout.html') && !localStorage.getItem('token')) {
    window.location.href = 'login.html?redirect=checkout.html';
}
window.goToCheckout = (e) => {
    if (e) e.preventDefault();
    if (!localStorage.getItem('token')) {
        showToast('Debes iniciar sesión para comprar', 'fa-lock');
        setTimeout(() => window.location.href = 'login.html?redirect=checkout.html', 1500);
    } else {
        window.location.href = 'checkout.html';
    }
};
// ====================================================
`;
if (!script.includes('window.goToCheckout')) {
    script = script.replace(/window\.formatPrice =/, authGuard + '\nwindow.formatPrice =');
}

// 2. Replace static link in Side Cart
script = script.replace(/<a href="checkout\.html" class="btn btn-block" style="text-align:center;">Finalizar.*?<\/a>/g, '<button onclick="window.goToCheckout(event)" class="btn btn-block" style="text-align:center; width:100%;"><i class="fa-solid fa-lock" style="margin-right:8px;"></i> Finalizar Compra</button>');

// 3. Update login.html and register.html redirect logic
// Inside handleGoogleLogin
script = script.replace(/setTimeout\(\(\) => window\.location\.href = data\.role === 'admin' \? 'admin\.html' : 'perfil\.html', 1500\);/g, `
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    setTimeout(() => {
                        if (redirect) window.location.href = redirect;
                        else window.location.href = data.role === 'admin' ? 'admin.html' : 'perfil.html';
                    }, 1500);
`);

// Inside email/password login logic (we need to find it)
script = script.replace(/setTimeout\(\(\) => \{\s*window\.location\.href = data\.role === 'admin' \? 'admin\.html' : 'perfil\.html';\s*\}, 1500\);/, `
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirect = urlParams.get('redirect');
                        setTimeout(() => {
                            if (redirect) window.location.href = redirect;
                            else window.location.href = data.role === 'admin' ? 'admin.html' : 'perfil.html';
                        }, 1500);
`);

// Inside email/password register logic
script = script.replace(/setTimeout\(\(\) => window\.location\.href = 'login\.html', 1500\);/, `
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    setTimeout(() => window.location.href = 'login.html' + (redirect ? '?redirect=' + redirect : ''), 1500);
`);


fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js updated with auth guards and redirect flows');
