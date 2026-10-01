// Browser fixtures intercept every API request; no real cart or stock is changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const photo = '/uploads/hero-graphite-phone-v2.jpg';
const products = [{id: 90001, name: 'PhoneSpot Modelo 1.5', category: 'celulares', brand: 'Apple', price: 100,
    stock: 8, image_url: photo, images: [photo], variants: [
        {color: 'Negro', capacity: '128GB', stock: 4, price: 100, image_url: photo},
        {color: 'Blanco', capacity: '256GB', stock: 4, price: 120, image_url: photo}
    ]}, {id: 90002, name: 'Equipo sin variantes', category: 'celulares', brand: 'Apple', price: 90,
    stock: 4, image_url: photo, images: [photo], variants: []}];

async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/add-to-cart');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage();
            await page.setViewport({width, height: 900});
            await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            let cart = [];
            let mode = 'success';
            let writes = 0;
            let failRead = false;
            await page.setRequestInterception(true);
            page.on('request', async request => {
                const url = new URL(request.url());
                if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/')) return request.continue();
                const reply = (body, status = 200) => request.respond({status, contentType: 'application/json', body: JSON.stringify(body)});
                if (url.pathname === '/api/products') return reply(products);
                if (url.pathname.startsWith('/api/products/')) return reply(products.find(p => String(p.id) === url.pathname.split('/').pop()));
                if (url.pathname === '/api/settings') return reply({carousel: []});
                if (url.pathname === '/api/dollar-rate') return reply({rate: 1400});
                if (url.pathname.startsWith('/api/cart/')) {
                    if (request.method() === 'GET') {
                        if (failRead) {failRead = false; return reply({error: 'Temporary read failure'}, 503);}
                        return reply(cart);
                    }
                    writes++;
                    const data = JSON.parse(request.postData());
                    const action = mode;
                    await new Promise(resolve => setTimeout(resolve, 450));
                    if (action === 'stock-error') return reply({error: 'No hay stock disponible para esta variante.'}, 409);
                    const product = products.find(p => p.id === data.product_id);
                    const variant = product.variants.find(v => [v.color, v.capacity].join(' - ') === data.variant_name);
                    cart = cart.filter(item => !(String(item.id) === String(product.id) && (item.variant_name || '') === data.variant_name));
                    cart.push({id: String(product.id), name: product.name, variant_name: data.variant_name,
                        price: variant?.price || product.price, quantity: data.quantity, img: photo, category: 'celulares',
                        expires_at: new Date(Date.now() + 86400000).toISOString()});
                    if (action === 'lost-response') return request.abort('failed');
                    if (action === 'sync-error') failRead = true;
                    return reply({success: true});
                }
                return reply([]);
            });
            await page.goto(base + '/catalogo.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-card[data-id="90001"]');
            const selector = '.product-card[data-id="90001"]';
            await page.evaluate(selector => {
                const button = document.querySelector(selector + ' .add-to-cart-btn');
                button.click(); button.click(); button.click();
            }, selector);
            assert.equal(await page.$eval(selector + ' .add-to-cart-btn', b => b.getAttribute('aria-busy')), 'true');
            assert.equal(await page.$eval(selector + ' .var-select', select => select.disabled), true);
            await page.waitForFunction(selector => document.querySelector(selector)?.dataset.cartState === 'success', {}, selector);
            assert.equal(writes, 1);
            assert.equal(cart[0].quantity, 1);
            assert.equal(await page.$eval(selector + ' h4', element => element.textContent), products[0].name);
            await page.evaluate(() => document.getElementById('close-cart-btn')?.click());
            await page.$eval(selector + ' .cart-action-status', element => element.scrollIntoView({block: 'center'}));
            await new Promise(resolve => setTimeout(resolve, 450));
            await page.screenshot({path: path.join(output, `catalog-confirmed-${width}.png`)});
            await page.waitForFunction(selector => !document.querySelector(selector + ' .add-to-cart-btn').disabled, {}, selector);
            mode = 'stock-error';
            await page.$eval(selector + ' .add-to-cart-btn', button => button.click());
            await page.waitForFunction(selector => document.querySelector(selector)?.dataset.cartState === 'error', {}, selector);
            assert.match(await page.$eval(selector + ' .cart-action-status', el => el.textContent), /stock/);
            assert.equal(cart[0].quantity, 1);
            assert.equal(await page.$eval(selector + ' .add-to-cart-btn', b => b.disabled), false);
            mode = 'lost-response';
            await page.$eval(selector + ' .add-to-cart-btn', button => button.click());
            await page.waitForFunction(selector => document.querySelector(selector)?.dataset.cartState === 'success', {}, selector);
            assert.equal(cart[0].quantity, 2);
            await page.evaluate(() => document.getElementById('close-cart-btn')?.click());
            await page.waitForFunction(selector => !document.querySelector(selector + ' .add-to-cart-btn').disabled, {}, selector);
            mode = 'sync-error';
            await page.$eval(selector + ' .add-to-cart-btn', button => button.click());
            await page.waitForFunction(selector => document.querySelector(selector)?.dataset.cartState === 'success', {}, selector);
            assert.match(await page.$eval(selector + ' .cart-action-status', el => el.textContent), /actualizando/);
            assert.equal(cart[0].quantity, 3);
            await page.waitForFunction(selector => !document.querySelector(selector + ' .add-to-cart-btn').disabled, {}, selector);
            mode = 'success';
            // Different cards must serialize their writes without losing either item.
            await page.evaluate(() => document.querySelectorAll('.product-card .add-to-cart-btn').forEach(button => button.click()));
            await page.waitForFunction(() => [...document.querySelectorAll('.product-card')].every(card => card.dataset.cartState === 'success'));
            assert.equal(cart.find(item => item.id === '90001').quantity, 4);
            assert.equal(cart.find(item => item.id === '90002').quantity, 1);
            await page.evaluate(() => document.getElementById('close-cart-btn')?.click());
            await page.goto(base + '/producto.html?id=90001', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            await page.$eval('.var-btn[data-type="color"][data-val="Blanco"]', button => button.click());
            await page.$eval('.product-details .add-to-cart-btn', button => button.click());
            await page.waitForFunction(() => document.querySelector('.product-details')?.dataset.cartState === 'success');
            const white = cart.find(item => item.variant_name === 'Blanco - 256GB');
            assert.equal(white.quantity, 1);
            assert.equal(white.price, 120);
            await page.evaluate(() => document.getElementById('close-cart-btn')?.click());
            await page.$eval('.product-details .cart-action-status', element => element.scrollIntoView({block: 'center'}));
            await new Promise(resolve => setTimeout(resolve, 450));
            await page.screenshot({path: path.join(output, `product-confirmed-${width}.png`)});
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Desktop/mobile: duplicate clicks, loading, stock rejection, lost response, confirmed write with failed sync, concurrent products and variant prices passed. No real API writes.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
