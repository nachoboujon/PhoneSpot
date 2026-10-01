// All store APIs are intercepted: no real cart or order mutations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3100';
const image = '/uploads/hero-graphite-phone-v2.jpg';
const alternate = '/uploads/hero-graphite-laptop-v2.jpg';
const product = {id: 90001, name: 'Equipo de prueba', brand: 'Apple', category: 'celulares', price: 100, stock: 8,
    description: '[Condición: Nuevo]', image_url: image, images: [image, alternate],
    variants: ['Negro', 'Blanco'].flatMap(color => ['128GB', '256GB'].map((capacity, index) => ({
        color, capacity, stock: 2, price: index ? 110 : 100, image_url: index ? alternate : image
    })))};
async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/shopping-experience');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            let rate = 1565;
            await page.setViewport({width, height: 900});
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.origin !== new URL(base).origin) return request.respond({status: 200, body: ''});
                if (!url.pathname.startsWith('/api/')) return request.continue();
                let body = [];
                if (url.pathname === '/api/products') body = [product];
                else if (url.pathname.startsWith('/api/products/')) body = product;
                else if (url.pathname === '/api/dollar-rate') body = {success: true, rate};
                else if (url.pathname === '/api/settings') body = {carousel: []};
                else if (url.pathname.startsWith('/api/cart/')) body = [{id: '90001', name: product.name, price: 100, quantity: 1,
                    img: image, variant_name: 'Negro - 128GB', expires_at: new Date(Date.now() + 86400000).toISOString()}];
                return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
            });
            await page.goto(base + '/catalogo.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-card');
            assert.equal(await page.evaluate(() => window.formatPrice(100)), '$156.500');
            if (width === 390) {
                await page.click('#catalog-filter-toggle');
                await page.hover('#catalog-filter-toggle');
                assert.equal(await page.$eval('#catalog-filter-toggle', el => getComputedStyle(el).transform), 'none');
            }
            await page.hover('.filter-title');
            assert.equal(await page.$eval('.filter-title', el => getComputedStyle(el).transform), 'none');
            assert.equal(await page.$eval('.filter-title', el => getComputedStyle(el).boxShadow), 'none');
            const expanded = await page.$eval('.filter-title', el => el.getAttribute('aria-expanded'));
            await page.click('.filter-title');
            assert.equal(await page.$eval('.filter-title', el => el.getAttribute('aria-expanded')), expanded === 'true' ? 'false' : 'true');
            if (expanded === 'true') await page.click('.filter-title');
            await page.hover('.filter-label');
            assert.equal(await page.$eval('.filter-label', el => getComputedStyle(el).transform), 'none');
            await page.click('.cat-checkbox[value="celulares"]');
            await page.waitForSelector('.product-card');
            assert.equal(await page.$$eval('.product-card', cards => cards.length), 1);
            await page.screenshot({path: path.join(output, `filters-${width}.png`)});
            await page.click('.cart-icon');
            await page.waitForSelector('#side-cart.active');
            await page.waitForFunction(() => document.querySelector('#close-cart-btn').getBoundingClientRect().right <= innerWidth);
            await page.hover('#close-cart-btn');
            assert.equal(await page.$eval('#close-cart-btn', el => getComputedStyle(el).transform), 'none');
            assert.equal(await page.$eval('#close-cart-btn', el => getComputedStyle(el).boxShadow), 'none');
            assert.equal(await page.$eval('#close-cart-btn', el => el.getBoundingClientRect().width), 44);
            await page.screenshot({path: path.join(output, `cart-close-${width}.png`)});
            await page.click('#close-cart-btn');
            assert.equal(await page.$('#side-cart.active'), null);
            await page.goto(base + '/producto.html?id=90001', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            assert.equal(await page.$$eval('.var-btn[data-type="color"] img', imgs => imgs.length), 0);
            const before = await page.$eval('#main-product-img', el => el.src);
            await page.$eval('.var-btn[data-type="capacity"][data-val="256GB"]', el => el.scrollIntoView({block: 'center', behavior: 'instant'}));
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.click('.var-btn[data-type="capacity"][data-val="256GB"]');
            await page.waitForFunction(() => document.querySelector('.product-details').dataset.selectedVariant.includes('256GB'));
            assert.equal(await page.$eval('#main-product-img', el => el.src), before);
            assert.equal(await page.$eval('.gallery-thumbnails', el => el.hidden), true);
            assert.match(await page.$eval('#dynamic-price', el => el.textContent), /172\.150/);
            await page.screenshot({path: path.join(output, `product-${width}.png`)});
            rate = 1665;
            await page.reload({waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            assert.equal(await page.evaluate(() => window.formatPrice(100)), '$166.500');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Filters, cart close hover, color photo stability, variant prices and updated USD/ARS rate after reload passed on desktop/mobile. No real API mutations.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
