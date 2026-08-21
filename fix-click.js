const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldClickLogic = `                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const type = e.target.getAttribute('data-type');
                            document.querySelectorAll(\`[data-type="\${type}"]\`).forEach(el => {
                                el.classList.remove('active');
                                el.style.borderColor = '#e5e5ea';
                                el.style.background = '#fff';
                            });
                            e.target.classList.add('active');
                            e.target.style.borderColor = '#0071e3';
                            e.target.style.background = '#fff';
                            window.checkVariantStock(prod);
                        });
                    });`;

const newClickLogic = `                    const btns = document.querySelectorAll('.var-btn');
                    btns.forEach(b => {
                        b.addEventListener('click', (e) => {
                            const targetBtn = e.target.closest('.var-btn');
                            if (!targetBtn) return;
                            const type = targetBtn.getAttribute('data-type');
                            
                            document.querySelectorAll(\`.var-btn[data-type="\${type}"]\`).forEach(el => {
                                el.classList.remove('active');
                                el.style.borderColor = '#e5e5ea';
                                if (type !== 'color') el.style.background = '#fff';
                            });
                            
                            targetBtn.classList.add('active');
                            targetBtn.style.borderColor = '#0071e3';
                            if (type !== 'color') targetBtn.style.background = '#fff';
                            
                            window.checkVariantStock(prod);
                        });
                    });`;

s = s.replace(oldClickLogic, newClickLogic);
fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Fixed click listener logic');
