// Rebuild the imported PDF catalog as one product per iPhone model.
// Usage: node scripts/maintenance/group-iphone-list.js [--apply]
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '../..');
const cards = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/iphone-import-preview.json'), 'utf8'));
const grouped = new Map();
for (const card of cards) {
    if (!grouped.has(card.model)) grouped.set(card.model, []);
    grouped.get(card.model).push(card);
}
if (cards.length !== 154 || grouped.size !== 19) throw new Error('Unexpected PDF catalog size');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    const { data: products, error } = await supabase.from('products')
        .select('id,name,image_url,archived_at').range(0, 999);
    if (error) throw error;
    const byName = new Map(products.map(product => [product.name, product]));
    const ids = cards.map(card => byName.get(card.name)?.id).filter(Boolean);
    const activeGroupNames = [...grouped.keys()].filter(name => byName.get(name) && !byName.get(name).archived_at);
    if (ids.length !== 154 || activeGroupNames.length) {
        throw new Error(`Expected 154 source records and no active grouped titles; found ${ids.length} and ${activeGroupNames.length}`);
    }
    const { data: reservations, error: reservationError } = await supabase.from('cart_reservations')
        .select('product_id').in('product_id', ids).limit(1);
    if (reservationError) throw reservationError;
    if (reservations.length) throw new Error('Imported products have active cart reservations');

    console.log(`Will group ${cards.length} listings into ${grouped.size} model products.`);
    for (const [model, entries] of grouped) {
        const variants = entries.map(card => ({
            color: card.color,
            capacity: card.capacity,
            ram: '',
            batt: card.battery,
            condition: card.condition || 'Americano',
            stock: 10,
            price: card.price,
            image_url: byName.get(card.name).image_url
        }));
        const variantNames = variants.map(v => [v.color, v.capacity, v.batt, v.condition].join('|'));
        if (new Set(variantNames).size !== variants.length) throw new Error(`Duplicate variants in ${model}`);
        const idsForGroup = entries.map(card => byName.get(card.name).id);
        const images = [...new Set(variants.map(variant => variant.image_url))];
        const product = {
            name: model,
            description: `[Condición: Americano] ${model} americano. Elegí color, almacenamiento, condición de batería y tipo en las variantes. Las fotos corresponden a los equipos de la lista del proveedor.`,
            price: Math.min(...variants.map(variant => variant.price)),
            image_url: images[0],
            images,
            brand: 'Apple',
            category: 'celulares',
            stock: variants.reduce((total, variant) => total + variant.stock, 0),
            variants,
            is_offer: false
        };
        if (!process.argv.includes('--apply')) {
            console.log(`${model}: ${variants.length} variants, ${images.length} photos, from USD ${product.price}`);
            continue;
        }
        const { error: updateError } = await supabase.from('products').update(product).eq('id', idsForGroup[0]);
        if (updateError) throw new Error(`${model}: ${updateError.message}`);
        if (idsForGroup.length > 1) {
            const { error: archiveError } = await supabase.from('products')
                .update({ archived_at: new Date().toISOString() }).in('id', idsForGroup.slice(1));
            if (archiveError) throw new Error(`${model} archive: ${archiveError.message}`);
        }
        console.log(`Grouped ${model}: ${variants.length} variants, ${images.length} photos`);
    }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
