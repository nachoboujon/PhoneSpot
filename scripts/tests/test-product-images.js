const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const {normalizeProductImages, photoKey} = require('../../lib/product-images');
const source = require('../../artifacts/iphone-import-preview.json');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const storage = 'https://ntjshkufiyjeaazvectn.supabase.co/storage/v1/object/public/uploads/iphone-americano-2026-09-28/';

async function main() {
    const grouped = new Map();
    for (const card of source) {
        if (!grouped.has(card.model)) grouped.set(card.model, []);
        grouped.get(card.model).push(card);
    }
    const fixtures = [];
    let before = 0;
    let after = 0;
    for (const [name, entries] of grouped) {
        const variants = entries.map(card => ({color: card.color, capacity: card.capacity, batt: card.battery,
            condition: card.condition || 'Americano', price: card.price, stock: 10, image_url: storage + card.image}));
        const original = {id: fixtures.length + 10000, name, brand: 'Apple', category: 'celulares', price: entries[0].price,
            stock: variants.length * 10, image_url: variants[0].image_url, images: variants.map(v => v.image_url), variants};
        const normalized = normalizeProductImages(original);
        assert.equal(normalized.variants.length, variants.length);
        normalized.variants.forEach((variant, index) => {
            for (const key of ['color', 'capacity', 'batt', 'condition', 'price', 'stock']) assert.equal(variant[key], variants[index][key]);
            assert.equal(photoKey(variant.image_url), photoKey(variants[index].image_url), 'Replacement must have identical file contents');
        });
        assert.equal(new Set(normalized.images.map(photoKey)).size, normalized.images.length);
        assert.deepEqual(normalizeProductImages(normalized), normalized, 'Normalization must be stable');
        before += original.images.length;
        after += normalized.images.length;
        fixtures.push(normalized);
    }
    assert.equal(before, 154);
    assert.equal(after, 111);
    const custom = normalizeProductImages({image_url: '/uploads/one.jpg', images: ['/uploads/two.jpg', '/uploads/one.jpg'], variants: []});
    assert.deepEqual(custom.images, ['/uploads/one.jpg', '/uploads/two.jpg']);
    assert.notEqual(photoKey('https://another-store.example/iphone-p01-01.jpg'), photoKey(storage + 'iphone-p01-01.jpg'));

    const browser = await puppeteer.launch({headless: true});
    const findings = [];
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/')) return request.continue();
            let body = [];
            if (url.pathname.startsWith('/api/products/')) body = fixtures.find(p => String(p.id) === url.pathname.split('/').pop());
            else if (url.pathname === '/api/products') body = fixtures;
            else if (url.pathname === '/api/dollar-rate') body = {rate: 1400};
            else if (url.pathname === '/api/settings') body = {carousel: []};
            return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body || {})});
        });
        for (const product of fixtures) {
            await page.setViewport({width: 390, height: 844});
            await page.goto(`${base}/producto.html?id=${product.id}`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            const colors = [...new Set(product.variants.map(v => v.color))];
            for (const color of colors) {
                await page.evaluate(color => [...document.querySelectorAll('.var-btn[data-type="color"]')].find(button => button.dataset.val === color).click(), color);
                const gallery = await page.evaluate(() => ({urls: [...document.querySelectorAll('.gallery-thumb')].map(button => button.dataset.image),
                    main: document.getElementById('main-product-img').src, variant: document.querySelector('.product-details').dataset.selectedVariant}));
                const matching = product.variants.filter(v => v.color === color);
                assert.equal(gallery.urls.length, new Set(matching.map(v => v.photo_key)).size, `${product.name}, ${color}`);
                assert.equal(new Set(gallery.urls).size, gallery.urls.length);
                assert.ok(matching.some(v => photoKey(v.image_url) === photoKey(gallery.main)), `${product.name}, ${color}: ${gallery.main}`);
                assert.ok(gallery.variant.startsWith(color));
                if (gallery.urls.length > 1) {
                    await page.evaluate(() => document.querySelectorAll('.gallery-thumb')[1].click());
                    assert.equal(await page.$eval('#main-product-img', img => img.src), gallery.urls[1]);
                }
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            findings.push({name: product.name, variants: product.variants.length, uniquePhotos: product.images.length, colors: colors.length});
        }
        await page.setViewport({width: 1440, height: 900});
        await page.goto(`${base}/catalogo.html`, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector('.product-card');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
    } finally {await browser.close();}
    const output = path.resolve(__dirname, '../../artifacts/audit/image-deduplication');
    fs.mkdirSync(output, {recursive: true});
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({before, after, removed: before - after, findings}, null, 2));
    console.log(JSON.stringify({models: fixtures.length, variants: before, uniquePhotosPerModel: after, redundantEntriesRemoved: before - after,
        colorSelectors: 'passed', galleries: 'passed', catalog: 'passed', preservedStockAndPrices: true}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
