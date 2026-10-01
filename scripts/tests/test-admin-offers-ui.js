// Fully intercepted admin/catalog flow: no real products or offers are changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3100';
async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/admin-offers');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const products = ['celulares', 'notebooks', 'accesorios'].map((category, index) => ({id: 90001 + index,
                name: `Producto ${category}`, brand: 'Apple', category, price: 100, stock: 3, description: 'Producto publicado',
                image_url: '/uploads/hero-graphite-phone-v2.jpg', images: [], is_offer: false,
                variants: index === 1 ? [{color: 'Negro', capacity: '256GB', price: 120, stock: 3}] : []}));
            const originals = structuredClone(products);
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewport({width, height: 900});
            await page.evaluateOnNewDocument(() => localStorage.setItem('phoneSpotToken', 'admin-fixture'));
            let writes = [];
            let mode = 'success';
            let created = 0;
            await page.setRequestInterception(true);
            page.on('request', async request => {
                const url = new URL(request.url());
                if (url.origin !== new URL(base).origin) return request.respond({status: 200, body: ''});
                if (!url.pathname.startsWith('/api/')) return request.continue();
                const reply = (body, status = 200) => request.respond({status, contentType: 'application/json', body: JSON.stringify(body)});
                if (url.pathname === '/api/admin/session') return request.respond({status: 204});
                if (url.pathname === '/api/products' && request.method() === 'POST') {created++; return reply({}, 500);}
                if (url.pathname === '/api/products') return reply(products);
                if (url.pathname.startsWith('/api/products/') && request.method() === 'PUT') {
                    const body = JSON.parse(request.postData());
                    writes.push(body);
                    assert.deepEqual(Object.keys(body), ['is_offer']);
                    await new Promise(resolve => setTimeout(resolve, 150));
                    if (mode === 'rejected') return reply({error: 'No se pudo guardar la oferta.'}, 500);
                    const product = products.find(item => String(item.id) === url.pathname.split('/').pop());
                    product.is_offer = body.is_offer;
                    if (mode === 'lost') return request.abort('failed');
                    return reply({is_offer: product.is_offer});
                }
                if (url.pathname === '/api/settings') return reply({carousel: []});
                if (url.pathname === '/api/dollar-rate') return reply({rate: 1565});
                if (url.pathname === '/api/stats') return reply({total_revenue: 0, total_orders: 0, total_items: 0, top_products: []});
                return reply([]);
            });
            await page.goto(base + '/admin.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.admin-offer-button');
            await page.$eval('#price-90001', input => {input.value = '777';});
            await page.$eval('#desc-90001', input => {input.value = 'Edición sin guardar';});
            await page.$eval('.admin-offer-button', button => {button.click(); button.click();});
            await page.waitForFunction(() => document.querySelector('.admin-offer-button').textContent === 'Quitar oferta');
            assert.equal(writes.length, 1);
            assert.equal(await page.$eval('#price-90001', input => input.value), '777');
            assert.equal(await page.$eval('#desc-90001', input => input.value), 'Edición sin guardar');
            await page.$eval('.admin-offer-controls', el => el.scrollIntoView({block: 'center', behavior: 'instant'}));
            await page.screenshot({path: path.join(output, `enabled-${width}.png`)});
            await page.$eval('.admin-offer-button', button => button.click());
            await page.waitForFunction(() => document.querySelector('.admin-offer-button').textContent === 'Poner en oferta');
            assert.equal(products[0].is_offer, false);
            mode = 'rejected';
            await page.$eval('.admin-offer-button', button => button.click());
            await page.waitForFunction(() => document.querySelector('.admin-offer-status').textContent.includes('No se pudo guardar'));
            assert.equal(await page.$eval('.admin-offer-button', el => el.disabled), false);
            assert.equal(products[0].is_offer, false);
            mode = 'lost';
            await page.$eval('.admin-offer-button', button => button.click());
            await page.waitForFunction(() => !document.querySelector('.admin-offer-button').disabled);
            mode = 'success';
            await page.$eval('.admin-offer-button', button => button.click());
            await page.waitForFunction(() => document.querySelector('.admin-offer-button').textContent === 'Quitar oferta');
            for (let index = 1; index < products.length; index++) {
                await page.$$eval('.admin-offer-button', (buttons, i) => buttons[i].click(), index);
                await page.waitForFunction(i => document.querySelectorAll('.admin-offer-button')[i].textContent === 'Quitar oferta', {}, index);
            }
            assert.equal(created, 0);
            products.forEach((p, i) => assert.deepEqual({...p, is_offer: false}, originals[i]));
            await page.goto(base + '/catalogo.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.offer-card');
            assert.equal(await page.$$eval('.offer-card', cards => cards.length), 3);
            assert.equal(await page.$$eval('.product-card p[style*="line-through"]', prices => prices.length), 0);
            await page.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('#offers-container .offer-card');
            assert.equal(await page.$$eval('#offers-container .offer-card', cards => cards.length), 3);
            assert.equal(await page.$$eval('#offers-container p[style*="line-through"]', prices => prices.length), 0);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Admin offers: enable/disable on existing devices, duplicate clicks, errors, lost-response retry, unsaved edits, preserved variants and catalog visibility passed at desktop/mobile. No real writes.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
