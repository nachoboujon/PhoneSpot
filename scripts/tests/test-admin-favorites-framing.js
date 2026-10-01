const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const {normalizeProductImages} = require('../../lib/product-images');
const manifest = require('../../public/uploads/official-products/manifest.json');
const raw = require('../../artifacts/image-audit-products.json');
const products = raw.map(product => normalizeProductImages(product));
const base = process.argv[2] || 'http://localhost:3000';
async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/admin-favorites-framing');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewport({width, height: 1000, deviceScaleFactor: 2});
            await page.evaluateOnNewDocument(() => localStorage.setItem('phoneSpotToken', 'admin-fixture'));
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (!url.pathname.startsWith('/api/') || url.origin !== new URL(base).origin) return request.continue();
                let body = [];
                if (url.pathname === '/api/admin/session') return request.respond({status: 204});
                if (url.pathname.startsWith('/api/products/') && request.method() === 'PUT') {
                    const payload = JSON.parse(request.postData());
                    assert.deepEqual(Object.keys(payload), ['is_offer']);
                    return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify({is_offer: payload.is_offer})});
                }
                if (url.pathname === '/api/products') body = url.searchParams.get('images') === 'original' ? raw : products;
                else if (url.pathname.startsWith('/api/products/')) body = products.find(product => String(product.id) === url.pathname.split('/').pop());
                else if (url.pathname === '/api/settings') body = {carousel: []};
                else if (url.pathname === '/api/dollar-rate') body = {rate: 1565};
                return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body || {})});
            });
            await page.goto(base + '/catalogo.html', {waitUntil: 'domcontentloaded'});
            const id = products.find(product => product.name === 'iPhone 17 Pro').id;
            const card = `.product-card[data-id="${id}"]`;
            await page.waitForSelector(card + ' .fav-btn');
            assert.equal(await page.$eval(card + ' .fav-btn', button => button.getAttribute('aria-pressed')), 'false');
            await page.$eval(card + ' .fav-btn', button => button.click());
            assert.equal(await page.$eval(card + ' .fav-btn', button => button.getAttribute('aria-pressed')), 'true');
            assert.equal(await page.$eval(card + ' .favorite-marker', marker => marker.hidden), false);
            await page.reload({waitUntil: 'domcontentloaded'});
            await page.waitForSelector(card + ' .fav-btn.active');
            await page.waitForSelector(card + ' img.image-framed');
            await page.$eval(card + ' img', img => img.decode());
            assert.equal(await page.$eval(card + ' img', img => img.naturalWidth), 640, 'Cards should load the smaller image');
            assert.ok(await page.$eval(card + ' .product-img-wrapper', el => el.clientHeight > 80), 'Image frame must not collapse');
            const favoriteSize = await page.$eval(card + ' .fav-btn', el => ({width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height}));
            assert.equal(favoriteSize.width, favoriteSize.height, 'Favorite control should remain circular');
            await page.$eval(card, el => el.scrollIntoView({block: 'center', behavior: 'instant'}));
            await page.screenshot({path: path.join(output, `favorite-${width}.png`)});
            await page.goto(`${base}/producto.html?id=${id}`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.favorite-detail-button.active');
            await page.waitForSelector('#main-product-img.image-framed');
            const frame = await page.$eval('#main-product-img', img => ({width: img.naturalWidth, height: img.naturalHeight,
                imageWidth: img.getBoundingClientRect().width, imageHeight: img.getBoundingClientRect().height,
                frameWidth: img.parentElement.clientWidth, frameHeight: img.parentElement.clientHeight, src: new URL(img.src).pathname}));
            const bounds = manifest.images.find(image => image.file === frame.src).contentBounds;
            assert.ok(Math.max(frame.imageWidth * bounds.width / frame.frameWidth, frame.imageHeight * bounds.height / frame.frameHeight) >= .82, 'Visible device must fill the frame');
            assert.ok(frame.height * bounds.height >= 1080, 'iPhone 17 needs real useful pixels, not a large blank canvas');
            await page.screenshot({path: path.join(output, `product-${width}.png`)});
            await page.$eval('.favorite-detail-button', button => button.click());
            assert.equal(await page.$eval('.favorite-detail-button', button => button.getAttribute('aria-pressed')), 'false');
            await page.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-card .fav-btn');
            const first = await page.$eval('.product-card', product => product.dataset.id);
            await page.$eval('.product-card .fav-btn', button => button.click());
            assert.equal(await page.$eval(`.product-card[data-id="${first}"] .favorite-marker`, marker => marker.hidden), false);
            await page.goto(base + '/admin.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('#admin-product-list .slide-item');
            await page.$eval('#admin-product-search', input => {input.value = 'iPhone 17'; input.dispatchEvent(new Event('input'));});
            assert.equal(await page.$$eval('#admin-product-list .slide-item', cards => cards.filter(card => card.style.display !== 'none').length), 3);
            assert.ok((await page.$eval('#admin-product-count', el => el.textContent)).startsWith('3 de 19'));
            await page.$eval('.admin-offer-button', button => button.click());
            await page.waitForFunction(() => document.querySelector('.admin-offer-button').textContent === 'Quitar oferta');
            await page.screenshot({path: path.join(output, `admin-${width}.png`)});
            await page.$eval('#admin-product-list', el => el.scrollIntoView({block: 'start', behavior: 'instant'}));
            await page.screenshot({path: path.join(output, `admin-products-${width}.png`)});
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.ok(await page.$eval('.admin-card', el => parseFloat(getComputedStyle(el).paddingLeft) >= 16));
            assert.deepEqual(errors, []);
            await context.close();
        }
        console.log('Admin search/layout, favorites persistence and visible markers, product save/remove and image framing/useful pixels passed at desktop/mobile. No real writes.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
