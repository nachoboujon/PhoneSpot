const fs = require('fs');
let s = fs.readFileSync('public/script.js', 'utf8');

const oldHeader = '<h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Color</h4>';
const newHeader = '<h4 style="font-size:1.1rem; margin-bottom:1rem; font-weight:700; color:#1d1d1f; letter-spacing: -0.2px;">Color - <span id="selected-color-name" style="color: #666; font-weight: 500;">${uniqueColors[0]}</span></h4>';
s = s.replace(oldHeader, newHeader);

const oldMap = '${uniqueColors.map((c,i) => `<button class="var-btn ${i===0?\'active\':\'\'}" data-type="color" data-val="${c}" style="padding:14px 28px; background:#fff; border: 2px solid ${i===0?\'#0071e3\':\'#e5e5ea\'}; border-radius:30px; font-weight:600; font-size:0.95rem; color:#1d1d1f; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;">${c}</button>`).join(\'\')}';
const newMap = '${uniqueColors.map((c,i) => `<button class="var-btn ${i===0?\'active\':\'\'}" data-type="color" data-val="${c}" title="${c}" onclick="document.getElementById(\\\'selected-color-name\\\').innerText=\\\'${c}\\\';" style="width:42px; height:42px; border-radius:50%; padding:3px; background:transparent; border: 2px solid ${i===0?\'#0071e3\':\'#e5e5ea\'}; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;"><div style="width:100%; height:100%; border-radius:50%; background:${window.getColorHex(c)}; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);"></div></button>`).join(\'\')}';
s = s.replace(oldMap, newMap);

fs.writeFileSync('public/script.js', s, 'utf8');
console.log('Updated color buttons to circles');
