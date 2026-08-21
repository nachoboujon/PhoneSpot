const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const badCode = `                    window.checkVariantStock(prod);
);
                    });
                    
                    // Inicializar estilos de botones active
                    document.querySelectorAll('.var-btn.active').forEach(el => {
                        el.style.background = '#111';
                        el.style.color = '#fff';
                    });
                    checkVariantStock(prod);
                }`;

const goodCode = `                    window.checkVariantStock(prod);
                }`;

s = s.replace(badCode, goodCode);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed syntax error!');
