// Imports the cards extracted by extract-iphone-list.py into Supabase.
// Usage: node scripts/maintenance/import-iphone-list.js [--apply]
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
if (!process.argv.includes('--apply')) process.exit(0);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) throw new Error('Supabase credentials are missing');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    const { data: existing, error: readError } = await supabase.from('products').select('id,name').ilike('name', 'iPhone%');
    if (readError) throw readError;
    const existingByName = new Map((existing || []).map((row) => [row.name, row.id]));
    let created = 0;
    let updated = 0;
    for (const [index, card] of cards.entries()) {
        const fileName = `iphone-americano-2026-09-28/${card.image}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, fs.readFileSync(path.join(imageDir, card.image)), {
            contentType: 'image/jpeg',
            upsert: true,
        });
        if (uploadError) throw new Error(`Image ${card.image}: ${uploadError.message}`);
        const { data: image } = supabase.storage.from('uploads').getPublicUrl(fileName);
        const product = {
            name: card.name,
            description: card.description,
            price: card.price,
            image_url: image.publicUrl,
            brand: 'Apple',
            category: 'celulares',
            stock: 10,
            variants: [{ color: card.color, capacity: card.capacity, batt: card.battery, stock: 10, price: card.price }],
            is_offer: false,
        };
        const id = existingByName.get(card.name);
        const query = id
            ? supabase.from('products').update(product).eq('id', id)
            : supabase.from('products').insert(product);
        const { error } = await query;
        if (error) throw new Error(`Product ${card.name}: ${error.message}`);
        if (id) updated += 1; else created += 1;
        if ((index + 1) % 25 === 0 || index + 1 === cards.length) console.log(`Imported ${index + 1}/${cards.length}`);
    }
    console.log(`Done: ${created} created, ${updated} updated`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
