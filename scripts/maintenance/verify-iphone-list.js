const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '../..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/iphone-import-preview.json'), 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    const { data, error } = await supabase.from('products')
        .select('id,name,description,price,image_url,images,brand,category,stock,variants')
        .is('archived_at', null).range(0, 999);
    if (error) throw error;
    assert.equal(data.length, 19);
    const byName = new Map(data.map(product => [product.name, product]));
    for (const card of source) {
        const product = byName.get(card.model);
        assert.ok(product, `Missing model: ${card.model}`);
        const variant = product.variants.find(entry =>
            entry.color === card.color && entry.capacity === card.capacity &&
            entry.batt === card.battery && entry.condition === (card.condition || 'Americano'));
        assert.ok(variant, `Missing variant: ${card.name}`);
        assert.equal(Number(variant.price), card.price);
        assert.equal(variant.stock, 10);
        assert.ok(variant.image_url);
        assert.ok(product.images.includes(variant.image_url));
    }
    for (const product of data) {
        assert.equal(product.stock, product.variants.reduce((sum, variant) => sum + variant.stock, 0));
        assert.equal(Number(product.price), Math.min(...product.variants.map(variant => Number(variant.price))));
        assert.ok(product.description.startsWith('[Condición: Americano]'));
    }
    const samples = [data[0], data[Math.floor(data.length / 2)], data.at(-1)];
    for (const product of samples) {
        const response = await fetch(product.image_url);
        assert.ok(response.ok && response.headers.get('content-type')?.startsWith('image/'));
    }
    console.log('Verified 19 models, 154 variants, prices, photos and stock.');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
