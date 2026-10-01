const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const {splitCommercialProduct} = require('../../public/product-commercial-types');
const {normalizeProductImages} = require('../../lib/product-images');
const originals = require('../../artifacts/image-audit-products.json');
const products = originals.map(product => normalizeProductImages(product));
const base = process.argv[2] || 'http://localhost:3000';
async function main() {
    const mixed = products.find(product => product.id === 89);
    const before = JSON.stringify(mixed);
    const split = splitCommercialProduct(mixed);
    assert.equal(split.length, 2);
    assert.equal(JSON.stringify(mixed), before, 'Do not mutate stored product data');
    assert.equal(split.reduce((sum, product) => sum + product.variants.length, 0), mixed.variants.length);
    assert.equal(new Set(split.map(product => product.favorite_key)).size, 2);
    for (const option of split) {
        assert.ok(option.variants.every(variant => option.commercial_type === 'apple_warranty' ? /Apple/i.test(variant.condition) : !/Apple/i.test(variant.condition)));
        assert.equal(option.stock, option.variants.reduce((sum, variant) => sum + variant.stock, 0));
        assert.deepEqual(splitCommercialProduct(option), [option]);
        assert.ok(option.images.every(image => option.variants.some(variant => variant.image_url === image)));
    }
    const unknown = splitCommercialProduct({...mixed, description: '', variants: [{condition: 'Sin activar', price: 10, stock: 1}]});
    assert.equal(unknown[0].commercial_type, 'standard', 'Activation state does not prove Apple warranty');
    const browser = await puppeteer.launch({headless: true});
    try {
        for (const width of [1440, 390]) {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            const errors = [], cart = [], writes = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewport({width, height: 950});
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/')) return request.continue();
                const reply = body => request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
                if (url.pathname === '/api/products') return reply(products);
                if (url.pathname.startsWith('/api/products/')) return reply(products.find(product => String(product.id) === url.pathname.split('/').pop()));
                if (url.pathname === '/api/settings') return reply({carousel: []});
                if (url.pathname === '/api/dollar-rate') return reply({rate: 1400});
                if (url.pathname.startsWith('/api/cart/')) {
                    if (request.method() === 'GET') return reply(cart);
                    const data = JSON.parse(request.postData()); writes.push(data);
                    const product = products.find(product => product.id === data.product_id);
                    const variant = product.variants.find(variant => [variant.color, variant.capacity, variant.ram, variant.batt ? `Bat: ${variant.batt}` : '', variant.condition ? `Cond: ${variant.condition}` : ''].filter(Boolean).join(' - ') === data.variant_name);
                    assert.ok(variant, 'Cart must preserve the actual backend variant identity');
                    cart.push({id: String(product.id), name: product.name, variant_name: data.variant_name, quantity: data.quantity, price: variant.price, img: variant.image_url});
                    return reply({success: true});
                }
                return reply([]);
            });
            await page.goto(`${base}/catalogo.html`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-card[data-id="89"]');
            assert.equal(await page.$$eval('.product-card[data-id="89"]', cards => cards.length), 2);
            const american = '.product-card[data-id="89"][data-commercial-type="americano"]';
            const warranty = '.product-card[data-id="89"][data-commercial-type="apple_warranty"]';
            await page.$eval(`${warranty} .fav-btn`, button => button.click());
            assert.equal(await page.$eval(`${american} .fav-btn`, button => button.getAttribute('aria-pressed')), 'false');
            assert.equal(await page.$eval(`${warranty} .fav-btn`, button => button.getAttribute('aria-pressed')), 'true');
            await page.evaluate(() => window.refreshVisibleStock(89));
            assert.ok(await page.$eval(`${american}`, card => JSON.parse(unescape(card.dataset.stockInfo)).variants.every(variant => !/Apple/.test(variant.condition))));
            assert.ok(await page.$eval(`${warranty}`, card => JSON.parse(unescape(card.dataset.stockInfo)).variants.every(variant => /Apple/.test(variant.condition))));
            await page.$eval(`${american} [data-compare-product]`, button => button.click());
            await page.$eval(`${warranty} [data-compare-product]`, button => button.click());
            assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('phoneSpotCompareIds'))), ['89', '89:apple_warranty']);
            await page.$eval('input[value="apple_warranty"]', input => input.click());
            await page.waitForFunction(() => [...document.querySelectorAll('.product-card')].every(card => card.dataset.commercialType === 'apple_warranty'));
            assert.equal(await page.$eval(`${warranty} h4 a`, link => new URL(link.href).searchParams.get('tipo')), 'apple_warranty');
            await page.goto(`${base}/producto.html?id=89&tipo=apple_warranty`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            assert.equal(await page.$eval('.product-details', detail => detail.dataset.commercialType), 'apple_warranty');
            assert.ok(await page.$eval('.product-condition-tag', tag => /Apple/.test(tag.textContent)));
            assert.ok(await page.$eval('.product-details', detail => JSON.parse(unescape(detail.dataset.stockInfo)).variants.every(variant => /Apple/.test(variant.condition))));
            await page.$eval('.product-details .add-to-cart-btn', button => button.click());
            await page.waitForFunction(() => document.querySelector('.product-details')?.dataset.cartState === 'success');
            await page.goto(`${base}/producto.html?id=89&tipo=americano`, {waitUntil: 'domcontentloaded'});
            await page.waitForSelector('.product-details');
            await page.$eval('.product-details .add-to-cart-btn', button => button.click());
            await page.waitForFunction(() => document.querySelector('.product-details')?.dataset.cartState === 'success');
            assert.equal(writes.length, 2);
            assert.match(writes[0].variant_name, /Garantía Apple/);
            assert.match(writes[1].variant_name, /Americano/);
            assert.notEqual(writes[0].variant_name, writes[1].variant_name);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            assert.deepEqual(errors, []);
            await context.close();
        }
    } finally {await browser.close();}
    console.log('American and Apple-warranty cards, filters, detail, favorites and cart variants passed on desktop/mobile. No real writes.');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
