const fs = require('fs');
let css = fs.readFileSync('public/style.css', 'utf8');

const newCSS = `
/* =================== SKELETON LOADERS =================== */
.skeleton-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 350px;
}
.skeleton-img, .skeleton-title, .skeleton-price, .skeleton-btn {
    background: #e0e0e0;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 8px;
}
[data-theme="dark"] .skeleton-img, 
[data-theme="dark"] .skeleton-title, 
[data-theme="dark"] .skeleton-price, 
[data-theme="dark"] .skeleton-btn {
    background: #333;
    background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
    background-size: 200% 100%;
}
.skeleton-img { height: 200px; width: 100%; }
.skeleton-title { height: 20px; width: 80%; }
.skeleton-price { height: 24px; width: 50%; }
.skeleton-btn { height: 40px; width: 100%; border-radius: 20px; }
@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* =================== WHATSAPP FLOTANTE =================== */
.float-wa {
    position: fixed;
    width: 60px;
    height: 60px;
    bottom: 30px;
    right: 30px;
    background-color: #25d366;
    color: #FFF;
    border-radius: 50px;
    text-align: center;
    font-size: 30px;
    box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: transform 0.3s ease;
    text-decoration: none;
}
.float-wa:hover {
    transform: scale(1.1);
    color: #fff;
}

/* =================== FADE-IN ANIMATION =================== */
.fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.fade-up.visible {
    opacity: 1;
    transform: translateY(0);
}

/* =================== STARS =================== */
.stars {
    color: #f1c40f;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
}
`;

if (!css.includes('skeleton-loading')) {
    fs.writeFileSync('public/style.css', css + '\n' + newCSS, 'utf8');
    console.log('Added CSS for aesthetic features');
}
