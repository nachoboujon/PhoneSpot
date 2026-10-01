// UI verification with intercepted APIs: no real stock, cart or account writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const settings = require('../../public/data/settings.json');
const product = {id: 90001, name: 'Equipo de prueba', description: '[Condición: Americano] Equipo de prueba.', brand: 'Apple', category: 'celulares',
    price: 100, stock: 5, image_url: '/uploads/hero-graphite-phone-v2.jpg', images: [], variants: []};
async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/home-iteration');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            for (const reduced of [false, true]) {
                const page = await browser.newPage();
                const errors = [];
                let writes = 0;
                let cart = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.setViewport({width, height: 900});
                await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference'}]);
                await page.evaluateOnNewDocument(() => {
                    localStorage.setItem('cookies_accepted', 'true');
                    window.homeReveals = [];
                    const animate = Element.prototype.animate;
                    Element.prototype.animate = function(frames, options) {
                        if (options.duration === 360) window.homeReveals.push(this.className);
                        return animate.call(this, frames, options);
                    };
                });
                await page.setRequestInterception(true);
                page.on('request', request => {
                    const url = new URL(request.url());
                    if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/')) return request.continue();
                    const reply = body => request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
                    if (url.pathname === '/api/products') return reply([product]);
                    if (url.pathname.startsWith('/api/products/')) return reply(product);
                    if (url.pathname === '/api/settings') return reply(settings);
                    if (url.pathname === '/api/dollar-rate') return reply({rate: 1400});
                    if (url.pathname.startsWith('/api/cart/')) {
                        if (request.method() === 'PUT') {
                            writes++;
                            const data = JSON.parse(request.postData());
                            cart = [{id: String(product.id), name: product.name, price: product.price, quantity: data.quantity, img: product.image_url,
                                category: 'celulares', variant_name: '', expires_at: new Date(Date.now() + 86400000).toISOString()}];
                            return reply({success: true});
                        }
                        return reply(cart);
                    }
                    return reply([]);
                });
                await page.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
                await page.waitForSelector('.product-card');
                assert.equal(await page.$eval('.business-hero', el => getComputedStyle(el).opacity), '1');
                assert.equal(await page.$eval('.home-contact', el => getComputedStyle(el).opacity), '1');
                assert.equal(await page.$('.newsletter form'), null);
                assert.equal(await page.$eval('.home-contact__email', el => new URL(el.href).protocol), 'mailto:');
                assert.equal(await page.$eval('.home-contact__whatsapp', el => new URL(el.href).hostname), 'wa.me');
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                assert.ok(await page.$eval('.dropdown-menu', el => parseFloat(getComputedStyle(el).paddingRight) >= 8));
                assert.ok(await page.$eval('.brands-section', el => parseFloat(getComputedStyle(el).paddingLeft) >= 16));
                await page.hover('#advisor-start');
                assert.equal(await page.$eval('#advisor-start', el => getComputedStyle(el).color), 'rgb(17, 17, 17)');
                await page.evaluate(() => scrollTo(0, 0));
                await page.mouse.move(0, 0);
                if (width === 390) {
                    await page.click('#mobile-menu-btn');
                    assert.equal(await page.$eval('#mobile-menu-btn', el => el.getAttribute('aria-expanded')), 'true');
                    await page.click('#mobile-menu-btn');
                }
                await page.screenshot({path: path.join(output, `home-top-${width}-${reduced ? 'reduced' : 'motion'}.png`)});
                await page.$eval('.home-category', el => el.scrollIntoView({block: 'center'}));
                await new Promise(resolve => setTimeout(resolve, 450));
                if (reduced) assert.equal(await page.evaluate(() => window.homeReveals.length), 0);
                else assert.ok(await page.evaluate(() => window.homeReveals.length > 0));
                await page.$eval('.product-card', el => el.scrollIntoView({block: 'center'}));
                await page.$eval('.product-card .add-to-cart-btn', el => {el.click(); el.click();});
                await page.waitForFunction(() => document.querySelector('.product-card')?.dataset.cartState === 'success');
                assert.equal(writes, 1);
                assert.equal(cart[0].quantity, 1);
                await page.$eval('#close-cart-btn', button => button.click());
                await page.$eval('.home-contact', el => el.scrollIntoView({block: 'center'}));
                await new Promise(resolve => setTimeout(resolve, 450));
                await page.screenshot({path: path.join(output, `home-contact-${width}-${reduced ? 'reduced' : 'motion'}.png`)});
                assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
        const fallback = await browser.newPage();
        await fallback.setJavaScriptEnabled(false);
        await fallback.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
        assert.equal(await fallback.$eval('.business-hero', el => getComputedStyle(el).opacity), '1');
        assert.equal(await fallback.$eval('.home-contact', el => getComputedStyle(el).opacity), '1');
        await fallback.close();
        console.log('Home desktop/mobile: visible initial content, scroll reveal, reduced motion, menu, real contact links, cart integration and no-JS static fallback passed. No real API writes.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
