const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const regex = /<p style="color: var\(--text-muted\); font-size: 1\.1rem;">Equipos premium con precios imbatibles por tiempo limitado\.<\/p>\s*<\/div>/;

const newHTML = `<p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2rem;">Equipos premium con precios imbatibles por tiempo limitado.</p>
                
                <!-- COUNTDOWN TIMER -->
                <div id="flash-countdown" style="display: none; justify-content: center; gap: 1rem; font-family: 'Courier New', Courier, monospace; font-weight: bold;">
                    <div style="background: var(--text-color); color: var(--bg-color); padding: 1rem; border-radius: 12px; min-width: 80px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <span id="cd-days" style="font-size: 2rem; display: block;">00</span>
                        <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Días</span>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--text-color); line-height: 80px;">:</div>
                    <div style="background: var(--text-color); color: var(--bg-color); padding: 1rem; border-radius: 12px; min-width: 80px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <span id="cd-hours" style="font-size: 2rem; display: block;">00</span>
                        <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Horas</span>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--text-color); line-height: 80px;">:</div>
                    <div style="background: var(--text-color); color: var(--bg-color); padding: 1rem; border-radius: 12px; min-width: 80px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <span id="cd-mins" style="font-size: 2rem; display: block;">00</span>
                        <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Min</span>
                    </div>
                    <div style="font-size: 2rem; font-weight: bold; color: var(--text-color); line-height: 80px;">:</div>
                    <div style="background: #ff4757; color: white; padding: 1rem; border-radius: 12px; min-width: 80px; box-shadow: 0 4px 10px rgba(255,71,87,0.4);">
                        <span id="cd-secs" style="font-size: 2rem; display: block;">00</span>
                        <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-family: sans-serif;">Seg</span>
                    </div>
                </div>
            </div>`;

if (html.match(regex)) {
    html = html.replace(regex, newHTML);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("HTML modified successfully.");
} else {
    console.log("Regex did not match.");
}
