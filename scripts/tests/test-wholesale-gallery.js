// Public catalog reads only; all other API calls are intercepted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3100';
async function main() {
    const response = await fetch(base + '/api/products');
    assert.equal(response.status, 200);
    const products = await response.json();
    const product = products.find(p => p.name === 'Motorola G86 Power 5G');
    assert.ok(product?.variants?.[0]?.images?.length >= 3);
    const browser = await puppeteer.launch({headless: true});
    const output = 'artifacts/audit/wholesale-gallery';
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('requestfailed', request => console.error('Failed request:', request.url(), request.failure()?.errorText));
            await page.setViewport({width, height: 900});
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (!url.pathname.startsWith('/api/')) return request.continue();
                let body = [];
                if (url.pathname === '/api/products') body = products;
                else if (url.pathname.startsWith('/api/products/')) body = product;
                else if (url.pathname === '/api/dollar-rate') body = {rate: 1565};
                else if (url.pathname === '/api/settings') body = {carousel: [], brands_list: 'Apple'};
                return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
            });
            await page.goto(base + '/catalogo.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-card');
            const brands = await page.$$eval('.brand-checkbox', els => els.map(e => e.value));
            for (const brand of ['motorola', 'blackview', 'doogee', 'hotwav', 'infinix', 'itel', 'oukitel', 'ulefone']) assert.ok(brands.includes(brand), brand);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.goto(`${base}/producto.html?id=${product.id}`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.gallery-thumb');
            assert.equal(await page.$$eval('.gallery-thumb', els => els.length), 3);
            const before = await page.$eval('#main-product-img', img => img.src);
            await page.$eval('.gallery-thumb:nth-child(2)', el => el.click());
            assert.notEqual(await page.$eval('#main-product-img', img => img.src), before);
            await page.$eval('#main-product-img', img => img.decode());
            await page.$$eval('.gallery-thumb img', imgs => Promise.all(imgs.map(img => img.decode())));
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.screenshot({path: `${output}/product-${width}.png`});
            await page.close();
        }
        console.log('Live imported product: three official views, brand filters, decoded photo and desktop/mobile layout passed. No API mutations.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
