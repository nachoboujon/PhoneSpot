const assert = require('assert');
const puppeteer = require('puppeteer');

(async () => {
    const response = await fetch('https://www.phonespot.site/api/products');
    assert.equal(response.status, 200);
    const products = await response.json();
    assert.equal(products.length, 19);
    assert.equal(products.reduce((sum, product) => sum + product.variants.length, 0), 154);
    const product = products.find(item => item.name === 'iPhone 14 Pro');
    assert.equal(product.variants.length, 16);
    const expected = product.variants.find(variant => variant.color === 'Morado' && variant.capacity === '256GB' && variant.batt === '100%');
    const imageResponse = await fetch(expected.image_url);
    assert.equal(imageResponse.status, 200);
    assert.ok(imageResponse.headers.get('content-type').startsWith('image/'));
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto(`https://www.phonespot.site/producto.html?id=${product.id}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.product-details', { timeout: 20000 });
        assert.equal(await page.$eval('.product-info h2', el => el.textContent), 'iPhone 14 Pro');
        assert.equal(await page.$$eval('.gallery-thumb', elements => elements.length), 16);
        await page.click('.var-btn[data-type="color"][data-val="Morado"]');
        await page.click('.var-btn[data-type="capacity"][data-val="256GB"]');
        const selected = await page.evaluate(() => ({
            name: document.querySelector('.product-details').dataset.selectedVariant,
            price: Number(document.querySelector('.product-details').dataset.price),
            image: document.querySelector('#main-product-img').src
        }));
        assert.equal(selected.name, 'Morado - 256GB - Bat: 100% - Cond: eSIM');
        assert.equal(selected.price, expected.price);
        assert.equal(selected.image, expected.image_url);
        console.log('Live catalog, model gallery, variant price and image verified.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
