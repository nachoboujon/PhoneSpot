// Preview by default; --apply removes these brands from the visible catalog.
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ quiet: true });

const brands = new Set(['ecopower', 'aiwa', 'ur']);
const matches = product => brands.has(String(product.brand || '').trim().toLowerCase())
    || /\b(ecopower|aiwa|ur)\b/i.test(product.name || '');
const db = createClient(process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

async function visibleProducts() {
    const products = [];
    for (let offset = 0; ; offset += 500) {
        const { data, error } = await db.from('products').select('*')
            .is('archived_at', null).order('id').range(offset, offset + 499);
        if (error) throw error;
        products.push(...data);
        if (data.length < 500) return products;
    }
}

async function main() {
    const before = await visibleProducts();
    const selected = before.filter(matches);
    console.log(JSON.stringify(selected.map(({ id, name, brand, category }) => ({ id, name, brand, category })), null, 2));
    console.log(`Selected ${selected.length} of ${before.length} visible products.`);
    if (!process.argv.includes('--apply')) return;

    const archivedAt = new Date().toISOString();
    const directory = path.resolve(__dirname, '../../artifacts/excluded-brands');
    fs.mkdirSync(directory, { recursive: true });
    const reportPath = path.join(directory, archivedAt.replace(/[:.]/g, '-') + '.json');
    const report = { archivedAt, brands: [...brands], beforeCount: before.length, products: selected };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    if (selected.length) {
        const { data, error } = await db.from('products').update({ archived_at: archivedAt })
            .in('id', selected.map(product => product.id)).is('archived_at', null).select('id');
        if (error) throw error;
        if (data.length !== selected.length) throw new Error('Archive count mismatch; inspect the saved snapshot.');
    }
    const after = await visibleProducts();
    if (after.some(matches)) throw new Error('Excluded brands remain visible.');
    const remainingIds = new Set(after.map(product => product.id));
    if (before.some(product => !matches(product) && !remainingIds.has(product.id))) {
        throw new Error('An unrelated product disappeared during verification.');
    }
    report.verifiedAt = new Date().toISOString();
    report.afterCount = after.length;
    report.archivedCount = selected.length;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    console.log(`Verified: ${selected.length} archived; 0 excluded-brand products visible; ${after.length} products remain.`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
