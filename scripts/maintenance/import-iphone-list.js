// Parses the cards extracted by extract-iphone-list.py into a reviewable preview.
// Usage: node scripts/maintenance/import-iphone-list.js --dump
const fs = require('fs');
const path = require('path');

require('dotenv').config({ quiet: true });

const root = path.resolve(__dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/iphone-list-source.json'), 'utf8'));
const imageDir = path.join(root, 'artifacts/iphone-list-images');
const colorPattern = '(Titanio del Desierto|Titanio Natural|Titanio Negro|Titanio Blanco|Titanio Azul|Verde|Morado|Negro|Blanco|Azul|Oro|Rosa|Plata|Amarillo|Rojo|Naranja)';
const cards = [];
const seen = new Set();
const duplicates = [];

for (const card of source) {
    let label = card.raw.split(/\bUSD\s*\d/)[0]
        .replace(/(?<=[A-Za-z])-[ \t]*\n\s*([a-záéíóú])/g, (_, letter) => letter)
        .replace(/\s+/g, ' ')
        .trim();
    label = label.replace(/^Phone\b/i, 'iPhone');
    const modelMatch = label.match(/^iPhone\s+(\d+)\s*(Pro Max|Pro|Mini)?\b/i);
    const detailMatch = label.match(new RegExp(`-\\s*${colorPattern}\\s*-\\s*(\\d+)\\s*(GB|TB)\\b`, 'i'));
    if (!modelMatch || !detailMatch) throw new Error(`Cannot parse p${card.page}:${card.card}: ${label}`);
    const suffix = { 'mini': 'mini', 'pro': 'Pro', 'pro max': 'Pro Max' }[modelMatch[2]?.toLowerCase()] || '';
    const model = `iPhone ${modelMatch[1]}${suffix ? ` ${suffix}` : ''}`;
    const color = detailMatch[1].replace(/^Titanio del Desierto$/i, 'Titanio del Desierto');
    const capacity = `${detailMatch[2]}${detailMatch[3].toUpperCase()}`;
    let condition = '';
    if (/\bESIM\b/i.test(label)) condition = 'eSIM';
    if (/\bAS\s*IS\b|\bASIS\b/i.test(label)) condition = 'AS IS';
    if (/\bASLY\b/i.test(label)) condition = 'ASLY';
    if (/Sin\s+Activar/i.test(label)) condition += condition ? ' · Sin activar' : 'Sin activar';
    if (/Garantia\s+Apple/i.test(label)) condition = 'Garantía Apple';
    if (/Con\s+Chip/i.test(label)) condition = 'Con chip';
    if (/\(80%\)\s*A\s*-/i.test(label)) condition = 'Grado A';
    const key = [model, color.toLowerCase(), capacity, card.battery, condition].join('|');
    if (seen.has(key)) {
        duplicates.push({ page: card.page, card: card.card, key });
        continue;
    }
    seen.add(key);
    const price = Math.floor((card.wholesale_usd + 30 + 5) / 10) * 10;
    const name = `${model} ${capacity} · ${color} · Batería ${card.battery}${condition ? ` · ${condition}` : ''}`;
    const description = `${model} americano, ${capacity} de almacenamiento y color ${color}. Batería ${card.battery} según la lista del proveedor.${condition ? ` Condición indicada: ${condition}.` : ''} Imagen del producto proporcionada por el proveedor.`;
    cards.push({ ...card, model, color, capacity, condition, name, description, price });
}

if (source.length !== 156 || cards.length !== 154 || duplicates.length !== 2) {
    throw new Error(`Unexpected card counts: ${source.length} source, ${cards.length} unique, ${duplicates.length} duplicate`);
}
if (cards.some((c) => c.name.length > 150 || !fs.existsSync(path.join(imageDir, c.image)))) {
    throw new Error('Name length or source image validation failed');
}
console.log(`Source cards: ${source.length}; unique products: ${cards.length}; exact duplicates: ${duplicates.length}`);
console.log('Duplicates:', duplicates);
console.log('Preview:', cards.slice(0, 4).map(({ name, wholesale_usd, price }) => ({ name, wholesale_usd, price })));
if (process.argv.includes('--dump')) {
    fs.writeFileSync(path.join(root, 'artifacts/iphone-import-preview.json'), JSON.stringify(cards, null, 2) + '\n');
}
if (process.argv.includes('--apply')) {
    throw new Error('La importación por ficha está deshabilitada. El catálogo actual está agrupado por modelo.');
}
process.exit(0);
