// Review with: node scripts/maintenance/import-tecno-list.js
// Publish with: node scripts/maintenance/import-tecno-list.js --apply
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/tecno-import-manifest.json'), 'utf8'));
const imageDir = path.join(root, 'artifacts/tecno-list-images');
const storagePrefix = 'tecno-mayorista-2026-09-28';
const rows = manifest.entries;
const grouped = new Map();
const rounded = price => Math.floor((price + manifest.markupUsd + manifest.roundToUsd / 2) / manifest.roundToUsd) * manifest.roundToUsd;

if (rows.length !== 13 || manifest.stockPerVariant !== 10) throw new Error('Unexpected source list');
for (const row of rows) {
    const file = path.join(imageDir, row.image);
    if (!fs.existsSync(file) || fs.readFileSync(file).subarray(0, 4).toString('hex') !== '52494646') throw new Error(`Missing or invalid WebP: ${row.image}`);
    if (!Number.isInteger(row.wholesaleUsd) || rounded(row.wholesaleUsd) <= 0) throw new Error(`Invalid price: ${row.model}`);
    if (!grouped.has(row.model)) grouped.set(row.model, []);
    grouped.get(row.model).push(row);
}
if (grouped.size !== 7) throw new Error(`Expected seven models, got ${grouped.size}`);
for (const [model, entries] of grouped) {
    if (new Set(entries.map(row => [row.color, row.capacity, row.ram].join('|'))).size !== entries.length) throw new Error(`Duplicate variant in ${model}`);
    console.log(`${model}: ${entries.map(row => `${row.color} ${row.capacity} ${row.ram} USD ${rounded(row.wholesaleUsd)}`).join('; ')}`);
}
if (!process.argv.includes('--apply')) return;

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!process.env.SUPABASE_URL || !key) throw new Error('Supabase credentials unavailable');
const supabase = createClient(process.env.SUPABASE_URL, key);

async function publish() {
    const { data: current, error: currentError } = await supabase.from('products').select('id,name,archived_at').in('name', [...grouped.keys()]);
    if (currentError) throw currentError;
    const active = new Map(current.filter(row => !row.archived_at).map(row => [row.name, row]));
    const needs = [...grouped.keys()].filter(model => !active.has(model));
    if (!needs.length) return console.log('All seven models already published.');
    console.log(`Publishing ${needs.length} missing models; existing models are left untouched.`);

    // Upload every picture before inserting products, so no product points to a missing image.
    const files = [...new Set(needs.flatMap(model => grouped.get(model).map(row => row.image)))];
    const { data: existingFiles, error: listError } = await supabase.storage.from('uploads').list(storagePrefix, { limit: 100 });
    if (listError) throw listError;
    const existingNames = new Set(existingFiles.map(file => file.name));
    const urls = new Map();
    for (const file of files) {
        const storagePath = `${storagePrefix}/${file}`;
        if (!existingNames.has(file)) {
            const { error } = await supabase.storage.from('uploads').upload(storagePath, fs.readFileSync(path.join(imageDir, file)), { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
            if (error) throw new Error(`${file}: ${error.message}`);
        }
        urls.set(file, supabase.storage.from('uploads').getPublicUrl(storagePath).data.publicUrl);
    }
    for (const model of needs) {
        const entries = grouped.get(model);
        const variants = entries.map(row => ({
            color: row.color, capacity: row.capacity, ram: row.ram,
            batt: '', condition: manifest.condition,
            stock: manifest.stockPerVariant, price: rounded(row.wholesaleUsd), image_url: urls.get(row.image)
        }));
        const images = [...new Set(variants.map(variant => variant.image_url))];
        const product = {
            name: model,
            description: `[Condición: ${manifest.condition}] ${model} nuevo y sellado. Elegí el color, la capacidad y la memoria RAM según las variantes disponibles. Fotos de cada color tomadas del catálogo mayorista o del material oficial de TECNO.`,
            price: Math.min(...variants.map(variant => variant.price)),
            image_url: images[0], images,
            brand: 'Tecno', category: 'celulares',
            stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
            variants, is_offer: false
        };
        const { data, error } = await supabase.from('products').insert(product).select('id,name,stock,variants');
        if (error) throw new Error(`${model}: ${error.message}`);
        if (!data?.[0] || data[0].variants.length !== entries.length) throw new Error(`${model}: insert verification failed`);
        console.log(`Published ${model} #${data[0].id}: ${entries.length} variants, ${images.length} photos, stock ${data[0].stock}`);
    }
}

publish().catch(error => { console.error(error); process.exitCode = 1; });
