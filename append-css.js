const fs = require('fs');
let s = fs.readFileSync('public/style.css', 'utf8');
const newCss = `
@keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes floatReverse {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(25px) rotate(-5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(46, 139, 87, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(46, 139, 87, 0); }
    100% { box-shadow: 0 0 0 0 rgba(46, 139, 87, 0); }
}

.floating-phone {
    position: absolute;
    z-index: 10;
    pointer-events: none;
    filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
    animation: float 6s ease-in-out infinite;
    max-width: 200px;
}
.floating-phone.reverse {
    animation: floatReverse 7s ease-in-out infinite;
}

/* Glassmorphism improvements */
.hero-content {
    background: rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 3rem !important;
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
}

.hero-content:hover {
    transform: translateY(-5px) scale(1.02);
}
`;
fs.writeFileSync('public/style.css', s + '\n' + newCss, 'utf8');
