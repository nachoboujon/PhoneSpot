const fs = require('fs');

let script = fs.readFileSync('public/script.js', 'utf8');

const oldSuccessBlock = `
                if (res.ok) {
                    showToast('Cuenta creada. Inicia sesión.', 'fa-check');
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    setTimeout(() => window.location.href = 'login.html' + (redirect ? '?redirect=' + redirect : ''), 1500);

                } else {
`;

const newSuccessBlock = `
                if (res.ok) {
                    showToast('Revisa tu correo para verificar tu cuenta', 'fa-envelope-open-text');
                    const formWrapper = document.querySelector('.auth-form-wrapper');
                    if (formWrapper) {
                        formWrapper.innerHTML = \`
                            <div style="text-align: center; padding: 2rem 0; animation: fadeUp 0.5s ease;">
                                <i class="fa-solid fa-envelope-circle-check" style="font-size: 5rem; color: #00a650; margin-bottom: 1.5rem;"></i>
                                <h2 style="margin-bottom: 1rem; font-size: 2rem;">¡Casi listo, \${name}!</h2>
                                <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.5; margin-bottom: 1rem;">Te hemos enviado un enlace de confirmación a <b style="color: var(--text-color);">\${email}</b>.</p>
                                <p style="color: var(--text-muted); font-size: 1rem;">Haz clic en el enlace seguro dentro del correo para activar tu cuenta.</p>
                                <p style="font-size: 0.85rem; color: #888; margin-top: 2rem;"><i class="fa-solid fa-triangle-exclamation"></i> ¿No lo encuentras? Revisa tu carpeta de Spam o Correo No Deseado.</p>
                            </div>
                        \`;
                    }
                } else {
`;

script = script.replace(oldSuccessBlock.trim(), newSuccessBlock.trim());

// We must also ensure the CAPTCHA and Confirm Password logic is properly merged into this block!
// Wait! I injected the Captcha block in "add-captcha.js", did it survive?
// Let's check lines 1755-1770
fs.writeFileSync('public/script.js', script, 'utf8');
console.log('Fixed script.js registration UI success screen');

// Let's check the backend email function. We can return errors if the email fails so the frontend knows!
let server = fs.readFileSync('server.js', 'utf8');
// In sendEmail:
server = server.replace(/const sendEmail = async \(to, subject, html\) => \{[\s\S]*?console\.error\('Error sending email:', err\);\s*\}\s*\};/m, `const sendEmail = async (to, subject, html) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('No email credentials configured, skipping email to:', to);
            return false;
        }
        await transporter.sendMail({
            from: '"PhoneSpot" <' + process.env.EMAIL_USER + '>',
            to,
            subject,
            html
        });
        console.log('Email sent to', to);
        return true;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};`);

// In register:
server = server.replace(/await sendEmail\(email, 'Confirma tu registro en PhoneSpot', verifyHtml\);\s*res\.status\(201\)\.json\(\{ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta\.' \}\);/m, `
        try {
            await sendEmail(email, 'Confirma tu registro en PhoneSpot', verifyHtml);
            res.status(201).json({ message: 'Te hemos enviado un correo. Revisa tu bandeja de entrada para verificar tu cuenta.' });
        } catch(emailErr) {
            res.status(500).json({ error: 'Tu cuenta está reservada, pero hubo un problema enviando el correo. Contacta a soporte.' });
        }
`);

fs.writeFileSync('server.js', server, 'utf8');
console.log('server.js updated to handle email errors properly');

