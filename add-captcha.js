const fs = require('fs');

let register = fs.readFileSync('public/register.html', 'utf8');

// 1. Add Confirm Password
const confirmPassHTML = `
                    <div class="auth-input-group">
                        <i class="fa-solid fa-lock"></i>
                        <input type="password" id="reg-password" placeholder="Contraseña segura" required>
                    </div>
                    <div class="auth-input-group">
                        <i class="fa-solid fa-check-double"></i>
                        <input type="password" id="reg-password-confirm" placeholder="Repite tu contraseña" required>
                    </div>
`;
register = register.replace(/<div class="auth-input-group">\s*<i class="fa-solid fa-lock"><\/i>\s*<input type="password" id="reg-password" placeholder="Contraseña segura" required>\s*<\/div>/, confirmPassHTML);

// 2. Add Anti-Robot Slider
const sliderHTML = `
                    <!-- Anti-Robot Slider -->
                    <div id="captcha-container" style="background: var(--gray-bg); border-radius: 12px; border: 1px solid var(--border-color); padding: 10px; margin-bottom: 1.5rem; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 50px;">
                        <span id="captcha-text" style="color: var(--text-muted); font-size: 0.9rem; z-index: 1;">Desliza para verificar que eres humano</span>
                        <div id="captcha-bg" style="position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: #00a650; transition: background 0.3s; z-index: 1;"></div>
                        <div id="captcha-slider" style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 2; transition: left 0.1s;">
                            <i class="fa-solid fa-angles-right" style="color: #555;"></i>
                        </div>
                    </div>
`;

register = register.replace(/<button type="submit" class="auth-btn">/, sliderHTML + '\n                    <button type="submit" class="auth-btn">');

fs.writeFileSync('public/register.html', register, 'utf8');
console.log('register.html updated with Confirm Password and Captcha');

// 3. Update script.js logic for Register
let script = fs.readFileSync('public/script.js', 'utf8');

const registerLogicUpdate = `
// ==================== REGISTRATION LOGIC WITH CAPTCHA & CONFIRM ====================
let isHuman = false;

window.addEventListener('DOMContentLoaded', () => {
    // Captcha Logic
    const slider = document.getElementById('captcha-slider');
    const container = document.getElementById('captcha-container');
    const bg = document.getElementById('captcha-bg');
    const text = document.getElementById('captcha-text');
    
    if (slider && container) {
        let isDragging = false;
        let startX = 0;
        let maxDrag = container.offsetWidth - slider.offsetWidth - 10; // 10px padding
        
        slider.addEventListener('mousedown', (e) => {
            if(isHuman) return;
            isDragging = true;
            startX = e.clientX || e.touches?.[0].clientX;
        });
        
        slider.addEventListener('touchstart', (e) => {
            if(isHuman) return;
            isDragging = true;
            startX = e.touches[0].clientX;
        });

        const onMove = (clientX) => {
            if (!isDragging) return;
            let diff = clientX - startX;
            if (diff < 0) diff = 0;
            if (diff > maxDrag) diff = maxDrag;
            
            slider.style.left = (diff + 5) + 'px';
            bg.style.width = (diff + 20) + 'px';
            
            if (diff >= maxDrag - 5) {
                // Success
                isDragging = false;
                isHuman = true;
                slider.innerHTML = '<i class="fa-solid fa-check" style="color: #00a650;"></i>';
                text.innerHTML = '<span style="color: white; font-weight: bold; position:relative; z-index: 3;">¡Verificado!</span>';
                bg.style.width = '100%';
            }
        };

        window.addEventListener('mousemove', (e) => onMove(e.clientX));
        window.addEventListener('touchmove', (e) => onMove(e.touches?.[0].clientX));

        const onUp = () => {
            if (!isDragging) return;
            isDragging = false;
            if (!isHuman) {
                slider.style.left = '5px';
                bg.style.width = '0';
            }
        };

        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
    }
});
`;

if (!script.includes('isHuman = false;')) {
    script += '\n' + registerLogicUpdate;
}

// Modify the actual register form submit listener in script.js
// Currently it is:
// const registerForm = document.getElementById('register-form');
// if (registerForm) { registerForm.addEventListener('submit', async (e) => { ... }) }

script = script.replace(/const registerForm = document\.getElementById\('register-form'\);\s*if \(registerForm\) \{\s*registerForm\.addEventListener\('submit', async \(e\) => \{\s*e\.preventDefault\(\);\s*const name = document\.getElementById\('reg-name'\)\.value;\s*const email = document\.getElementById\('reg-email'\)\.value;\s*const password = document\.getElementById\('reg-password'\)\.value;/, (match) => {
    return match + `
                
                const passConfirm = document.getElementById('reg-password-confirm');
                if (passConfirm && password !== passConfirm.value) {
                    return showToast('Las contraseñas no coinciden', 'fa-triangle-exclamation');
                }
                
                if (document.getElementById('captcha-container') && !isHuman) {
                    return showToast('Por favor, desliza para verificar que eres humano', 'fa-robot');
                }
    `;
});

fs.writeFileSync('public/script.js', script, 'utf8');
console.log('script.js updated with Captcha validation and Confirm Password');
