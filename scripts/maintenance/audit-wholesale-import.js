// Read-only verification of prices, variant identity, preserved products and hosted photos.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {createClient} = require('@supabase/supabase-js');
require('dotenv').config({quiet: true});
const base = 'artifacts/wholesale-2026-10-01';
const read = name => JSON.parse(fs.readFileSync(`${base}/${name}.json`));
const identity = v => [v.color, v.capacity, v.ram, v.batt || '', v.condition].join('|');
async function main() {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);
    const {data: products, error} = await db.from('products').select('*').is('archived_at', null);
    if (error) throw error;
    const pending = read('pending-phones');
    const rows = read('phones').filter(r => !pending.some(p => p.sourceIndex === r.sourceIndex));
    const urls = new Set();
    for (const row of rows) {
        const matches = products.filter(p => p.name === row.model);
        assert.equal(matches.length, 1, `One product per model: ${row.model}`);
        const v = matches[0].variants.find(v => identity(v) === identity(row));
        assert.ok(v, `Missing variant: ${row.label}`);
        assert.equal(v.price, Math.floor((row.wholesaleUsd + 35) / 10) * 10, row.label);
        assert.equal(v.stock, 10, `Initial variant stock: ${row.label}`);
        assert.ok(v.images.length && v.image_url === v.images[0]);
        assert.equal(new Set(v.images).size, v.images.length);
        v.images.forEach(url => urls.add(url));
    }
    for (const before of read('before-import')) {
        const after = products.find(p => p.id === before.id);
        assert.ok(after, `Preserve previous product ${before.name}`);
        for (const v of before.variants || []) {
            assert.deepEqual(after.variants.find(a => identity(a) === identity(v)), v, `Preserve previous variant ${before.name}`);
        }
    }
    for (const model of new Set(rows.map(r => r.model))) {
        const p = products.find(p => p.name === model);
        assert.equal(p.stock, p.variants.reduce((s, v) => s + Number(v.stock || 0), 0), `${model} total stock`);
    }
    const queue = [...urls];
    let checkedPhotos = 0;
    await Promise.all(Array.from({length: 2}, async () => {
        while (queue.length) {
            const url = queue.shift();
            let response;
            for (let attempt = 0; attempt < 5; attempt++) {
                response = await fetch(url, {method: 'HEAD', signal: AbortSignal.timeout(25000)});
                if (![429, 503].includes(response.status)) break;
                await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
            }
            assert.equal(response.status, 200, url);
            assert.match(response.headers.get('content-type'), /image\/webp/, url);
            assert.ok(Number(response.headers.get('content-length')) > 0, url);
            if (++checkedPhotos % 50 === 0) console.log(`Verified hosted photos ${checkedPhotos}/${urls.size}`);
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }));
    const report = {verifiedAt: new Date().toISOString(), activeProducts: products.length,
        importedModels: new Set(rows.map(r => r.model)).size, importedVariants: rows.length,
        hostedPhotos: urls.size, pendingVariants: pending.length,
        checks: ['supplier price + USD30, nearest USD10', '10 units per new variant', 'grouped models',
            'existing products and variants preserved', 'total stock', 'hosted WebP HTTP 200']};
    fs.writeFileSync(`${base}/verification.json`, JSON.stringify(report, null, 2) + '\n');
    console.log(report);
}
main().catch(error => {console.error(error); process.exitCode = 1;});
