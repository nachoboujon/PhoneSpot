const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '../..');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/iphone-import-preview.json'), 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
    const { data, error } = await supabase.from('products').select('id,name,description,price,image_url,brand,category,stock,variants').like('name', 'iPhone %').range(0, 999);
    if (error) throw error;
    const byName = new Map(data.map((product) => [product.name, product]));
    const issues = [];
    for (const card of expected) {
        const product = byName.get(card.name);
        if (!product) { issues.push(`Missing: ${card.name}`); continue; }
        const variant = product.variants?.[0];
        if (Number(product.price) !== card.price || product.stock !== 10 ||
            product.brand !== 'Apple' || product.category !== 'celulares' ||
            !product.description || !product.image_url || product.variants?.length !== 1 ||
            variant.color !== card.color || variant.capacity !== card.capacity ||
            variant.batt !== card.battery || variant.stock !== 10 || Number(variant.price) !== card.price) {
            issues.push(`Incorrect fields: ${card.name}`);
        }
    }
    const samples = [expected[0], expected[Math.floor(expected.length / 2)], expected.at(-1)];
    for (const card of samples) {
        const response = await fetch(byName.get(card.name).image_url);
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
            issues.push(`Image unavailable: ${card.name} (${response.status})`);
        }
    }
    if (issues.length) throw new Error(issues.join('\n'));
    console.log(`Verified ${expected.length} products, prices, variants, stock and three public images.`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
