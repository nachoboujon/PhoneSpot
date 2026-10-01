const fs = require('node:fs');
const base = 'artifacts/wholesale-2026-10-01';
const source = JSON.parse(fs.readFileSync(`${base}/source-cards.json`, 'utf8')).slice(0, 266);
const rows = [];
for (const [sourceIndex, raw] of source.entries()) {
    let label = raw.label.replace(/BlackView/gi, 'Blackview').replace(/UleFone/gi, 'Ulefone').replace(/\bIphone\b/gi, 'iPhone').replace(/\bPoco\b/gi, 'POCO').replace(/Egde/gi, 'Edge');
    let model, color = '', ram = '', capacity = '', condition = 'Nuevo sellado', type = '';
    const apple = label.match(/^(iPhone\s+\d+(?:\s+Pro(?:\s+Max)?)?)(?:\s+(CPO))?\s*-\s*(.*?)\s*-\s*(\d+(?:GB|TB))\s*-\s*Garantía Apple/i);
    const memory = label.match(/^(.*?)\s*-\s*(\d+)\s*(?:GB\s*)?R(?:A)?M\b\s*-\s*(.*)$/i);
    if (apple) {
        model = apple[1]; color = apple[3]; capacity = apple[4]; condition = apple[2] ? 'CPO · Garantía Apple' : 'Garantía Apple';
    } else if (memory) {
        model = memory[1].trim(); ram = `${memory[2]}GB`;
        const tail = memory[3].match(/^(.*?)\s*-\s*(\d+(?:GB|TB))$/i);
        if (tail) { color = tail[1]; capacity = tail[2]; }
        else if (/^\d+(GB|TB)$/.test(memory[3])) { capacity = memory[3]; }
        else throw new Error(`Cannot parse tail ${sourceIndex}: ${label}`);
    } else {
        const tail = label.match(/^(.*?)\s*-\s*(.*?)\s*-\s*(\d+(?:GB|TB))$/i);
        if (tail) { model = tail[1]; color = tail[2]; capacity = tail[3]; }
        else {
            const feature = label.match(/^(.*?)\s*-\s*(Negro \+ Naranja|Negro|Gris|Blanco)$/i);
            if (!feature) throw new Error(`Cannot parse ${sourceIndex}: ${label}`);
            model = feature[1].replace('CAT - ', 'CAT '); color = feature[2];
        }
    }
    if (model.includes('+ Auricular')) { model = model.replace(/\s*\+ Auricular/i, ''); type = 'Incluye auricular'; }
    if (model.includes('con Kit')) { model = model.replace(/\s+con Kit/i, ''); type = 'Incluye kit'; }
    if (/Sin Cargador/i.test(model)) { model = model.replace(/\s*\(Sin Cargador\)/i, ''); type = 'Sin cargador'; }
    if (/\(Slim\)/i.test(model)) { model = model.replace(/\s*\(Slim\)/i, ''); type = 'Slim'; }
    if (/\(Caja Grande\)/i.test(model)) { model = model.replace(/\s*\(Caja Grande\)/i, ''); type = 'Caja grande'; }
    if (/Plus Version/i.test(model)) { model = model.replace(/ Plus Version/i, ''); type = 'Versión Plus'; }
    if (/Doogee V Max LR Battle Rust/i.test(model)) { model = 'Doogee V Max LR'; color = 'Battle Rust'; }
    if (/^Motorola /i.test(model)) {
        model = model.replace(/^Motorola (?:Moto )?(Edge|G|E)/i, 'Motorola $1');
        model = model.replace(/ pro$/i, ' Pro');
        if (model === 'Motorola G86') model += ' 5G';
        if (model === 'Motorola Edge 60 Pro' && color === 'Morado') color = 'Violeta';
    }
    model = model.replace(/^Blackview XPLORE/i, 'Blackview Xplore').replace(/ PRO$/i, ' Pro').replace(/15c$/i, '15C');
    if (model === 'Ulefone 27T Pro') {model = 'Ulefone Armor 27T Pro+'; type = '';}
    color = ({Silver:'Plata',Black:'Negro',Glacier:'Glaciar'})[color] || color;
    const brand = model.startsWith('iPhone') ? 'Apple' : model.startsWith('KingKong') ? 'Cubot' : model.split(' ')[0];
    if (type) condition += ` · ${type}`;
    const price = Math.floor((raw.wholesaleUsd + 35) / 10) * 10;
    const entry = {...raw, sourceIndex, model, brand, color, capacity, ram, batt: '', condition, stock: 10, price};
    const duplicate = rows.find(row => [row.model,row.color,row.capacity,row.ram,row.condition].join('|') === [model,color,capacity,ram,condition].join('|'));
    if (duplicate) {
        if (duplicate.price !== price) throw new Error(`Conflicting duplicate ${sourceIndex}`);
        duplicate.duplicateSourceIndices = [...(duplicate.duplicateSourceIndices || []), sourceIndex];
        continue;
    }
    rows.push(entry);
}
fs.writeFileSync(`${base}/phones.json`, JSON.stringify(rows, null, 2) + '\n');
const grouped = new Map();
for (const row of rows) { if (!grouped.has(row.model)) grouped.set(row.model, []); grouped.get(row.model).push(row); }
console.log(`${source.length} source cards, ${rows.length} unique variants, ${grouped.size} models`);
for (const [model, entries] of grouped) console.log(`${model}: ${[...new Set(entries.map(row => row.color))].join(', ')} (${entries.length})`);
