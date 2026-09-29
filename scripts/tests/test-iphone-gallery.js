const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

const cards = require('../../artifacts/iphone-import-preview.json').filter(card => card.model === 'iPhone 14 Pro');
const storageBase = 'https://ntjshkufiyjeaazvectn.supabase.co/storage/v1/object/public/uploads/iphone-americano-2026-09-28/';
const variants = cards.map(card => ({
    color: card.color, capacity: card.capacity, ram: '', batt: card.battery,
    condition: card.condition || 'Americano', stock: 10, price: card.price,
    image_url: storageBase + card.image
}));
const product = {
    id: 999, name: 'iPhone 14 Pro', description: '[Condición: Americano] Elegí tu variante.',
    brand: 'Apple', category: 'celulares', stock: 160, price: 450,
    image_url: variants[0].image_url, images: variants.map(variant => variant.image_url), variants
};

(async () => {
    const server = spawn(process.execPath, ['server.js'], {
        cwd: path.resolve(__dirname, '../..'), env: { ...process.env, PORT: '3035' }, stdio: 'ignore'
    });
    let browser;
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 900 });
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().endsWith('/api/products/999')) {
                request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(product) });
            } else request.continue();
        });
        await page.goto('http://localhost:3035/producto.html?id=999', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.product-details', { timeout: 20000 });
        const initial = await page.evaluate(() => ({
            name: document.querySelector('.product-info h2')?.textContent,
            photos: document.querySelectorAll('.gallery-thumb').length
        }));
        assert.equal(initial.name, 'iPhone 14 Pro');
        assert.equal(initial.photos, 16);
        const layout = await page.evaluate(() => ({
            bodyWidth: document.body.scrollWidth,
            galleryWidth: document.querySelector('.product-gallery').getBoundingClientRect().width,
            infoLeft: document.querySelector('.product-info').getBoundingClientRect().left
        }));
        assert.ok(layout.bodyWidth <= 1280, `Horizontal overflow: ${layout.bodyWidth}px`);
        assert.ok(layout.galleryWidth < 700);
        assert.ok(layout.infoLeft < 1280);
        await page.setViewport({ width: 390, height: 844 });
        const mobileWidth = await page.evaluate(() => document.body.scrollWidth);
        assert.ok(mobileWidth <= 390, `Mobile horizontal overflow: ${mobileWidth}px`);
        await page.click('.var-btn[data-type="color"][data-val="Morado"]');
        await page.click('.var-btn[data-type="capacity"][data-val="256GB"]');
        const selection = await page.evaluate(() => ({
            variant: document.querySelector('.product-details').dataset.selectedVariant,
            image: document.querySelector('#main-product-img').src,
            price: document.querySelector('.product-details').dataset.price
        }));
        assert.equal(selection.variant, 'Morado - 256GB - Bat: 100% - Cond: eSIM');
        assert.equal(selection.price, '510');
        assert.equal(selection.image, variants.find(v => v.color === 'Morado' && v.capacity === '256GB' && v.batt === '100%').image_url);
        const catalog = await browser.newPage();
        await catalog.setRequestInterception(true);
        catalog.on('request', request => {
            if (request.url().endsWith('/api/products')) {
                request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([product]) });
            } else request.continue();
        });
        await catalog.goto('http://localhost:3035/catalogo.html', { waitUntil: 'domcontentloaded' });
        await catalog.waitForSelector('.product-card', { timeout: 20000 });
        const card = await catalog.evaluate(() => ({
            name: document.querySelector('.product-card h4')?.textContent,
            variants: document.querySelectorAll('.product-card .var-select').length,
            image: document.querySelector('.product-card .product-img')?.src
        }));
        assert.equal(card.name, 'iPhone 14 Pro');
        assert.ok(card.variants >= 4);
        assert.ok(card.image.startsWith(storageBase));
        console.log('Gallery, selectors and catalog card verified.');
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
