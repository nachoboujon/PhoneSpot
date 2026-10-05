// Fully intercepted browser checkout: no real orders, emails or stock mutations.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const item = {id: '90001', name: 'Equipo de prueba', category: 'celulares', price: 100, quantity: 1,
    variant_name: 'Negro - 128GB', img: '/uploads/hero-graphite-phone-v2.jpg', expires_at: new Date(Date.now() + 86400000).toISOString()};
async function main() {
    const browser = await puppeteer.launch({headless: true});
    const output = path.resolve(__dirname, '../../artifacts/audit/checkout-iteration');
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const width of [1440, 390]) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.setViewport({width, height: 900});
            await page.evaluateOnNewDocument(() => {
                localStorage.setItem('phoneSpotToken', 'checkout-fixture');
                window.open = () => {throw new Error('Automatic popup must not be used');};
            });
            let mode = 'success';
            let writes = 0;
            let cart = [item];
            let payload;
            await page.setRequestInterception(true);
            page.on('request', async request => {
                const url = new URL(request.url());
                if (url.origin !== new URL(base).origin) return request.respond({status: 200, contentType: 'application/json', body: '{}'});
                if (!url.pathname.startsWith('/api/')) return request.continue();
                const reply = (body, status = 200) => request.respond({status, contentType: 'application/json', body: JSON.stringify(body)});
                if (url.pathname === '/api/me') return reply({email: 'buyer@example.invalid', name: 'Cliente Prueba', phone: '3447416011', dni: '12345678', address: 'Calle Prueba 123', province: 'Entre Ríos', city: 'San José', postal_code: '3283'});
                if (url.pathname === '/api/settings') return reply({carousel: [], whatsapp_number: '+54 9 3447 416011'});
                if (url.pathname === '/api/dollar-rate') return reply({rate: 1400});
                if (url.pathname.startsWith('/api/cart/')) return reply(cart);
                if (url.pathname === '/api/orders/result') return reply({error: 'Pedido no encontrado'}, 404);
                if (url.pathname === '/api/orders' && request.method() === 'POST') {
                    writes++; payload = JSON.parse(request.postData());
                    await new Promise(resolve => setTimeout(resolve, 450));
                    if (mode === 'rejected') return reply({error: 'Tu reserva venció. Revisá el carrito.'}, 409);
                    if (mode === 'lost') return request.abort('failed');
                    if (mode === 'expired') return reply({error: 'Sesión vencida'}, 401);
                    return reply({orderId: 12345, total_ars: 0}, 201);
                }
                return reply([]);
            });
            const open = async () => {
                await page.goto(base + '/checkout.html', {waitUntil: 'domcontentloaded'});
                await page.waitForFunction(() => document.getElementById('chk-email').value === 'buyer@example.invalid');
                await page.waitForSelector('input[name="shipping_method"]');
            };
            await open();
            await page.$eval('#chk-lastname', input => {input.value = '   ';});
            await page.$eval('#btn-next-step', button => button.click());
            assert.equal(await page.$eval('#checkout-part2', el => getComputedStyle(el).display), 'none');
            assert.equal(await page.$eval('#chk-lastname', el => el.getAttribute('aria-invalid')), 'true');
            assert.equal(await page.$eval('#chk-lastname', el => el.getAttribute('aria-describedby')), 'chk-lastname-error');
            assert.match(await page.$eval('#chk-lastname-error', el => el.textContent), /Completá/);
            assert.equal(await page.evaluate(() => document.activeElement.id), 'chk-lastname');
            await page.screenshot({path: path.join(output, `validation-${width}.png`)});
            assert.equal(writes, 0);
            await page.$eval('#chk-lastname', input => {input.value = 'Prueba'; input.dispatchEvent(new Event('input', {bubbles: true}));});
            assert.equal(await page.$eval('#chk-lastname-error', el => el.textContent), '');
            assert.equal(await page.$eval('.checkout-back-link', el => el.getAttribute('href')), 'carrito.html');
            assert.equal(await page.$eval('#chk-name', el => el.autocomplete), 'given-name');
            if (width === 390) assert.ok(await page.$eval('#chk-phone', el => parseFloat(getComputedStyle(el).fontSize) >= 16));
            // Enter in step 1 advances to review, without creating an order.
            await page.$eval('#checkout-form', form => form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})));
            assert.equal(writes, 0);
            assert.match(await page.$eval('#checkout-review', el => el.textContent), /buyer@example.invalid/);
            assert.equal(await page.$eval('#step2-indicator', el => el.getAttribute('aria-current')), 'step');
            await page.$eval('#btn-prev-step', button => button.click());
            assert.equal(await page.evaluate(() => document.activeElement.id), 'checkout-contact-title');
            assert.equal(await page.$eval('#chk-lastname', el => el.value), 'Prueba');
            await page.$eval('#btn-next-step', button => button.click());
            assert.doesNotMatch(await page.$eval('#checkout-items', el => el.textContent), /Sin Cargo|Bonificado/);
            await new Promise(resolve => setTimeout(resolve, 350));
            await page.screenshot({path: path.join(output, `review-${width}.png`)});
            mode = 'rejected';
            await page.$eval('#checkout-form', form => {form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})); form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));});
            await page.waitForFunction(() => document.getElementById('checkout-status').textContent.includes('reserva venció'));
            assert.equal(writes, 1);
            assert.equal(await page.$eval('#btn-confirm-pay', el => el.disabled), false);
            cart = [{...item, quantity: 2}];
            await page.$eval('#btn-confirm-pay', button => button.click());
            await page.waitForFunction(() => document.getElementById('checkout-status').textContent.includes('carrito cambió'));
            assert.equal(writes, 1);
            mode = 'success';
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded'}), page.$eval('#btn-confirm-pay', button => button.click())]);
            assert.equal(writes, 2);
            assert.equal(payload.items[0].quantity, 2);
            assert.equal(new URL(page.url()).pathname, '/compra-exitosa.html');
            assert.deepEqual([...new URL(page.url()).searchParams.keys()], ['orderId']);
            assert.match(await page.$eval('#order-message', el => el.textContent), /\$0 ARS/);
            assert.equal(await page.$eval('#wp-btn', el => new URL(el.href).hostname), 'wa.me');
            assert.equal(await page.$eval('#wp-btn', el => new URL(el.href).pathname), '/5493447416011');
            await page.screenshot({path: path.join(output, `confirmation-${width}.png`)});
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await open();
            await page.$eval('#btn-next-step', button => button.click());
            mode = 'lost';
            await page.$eval('#btn-confirm-pay', button => button.click());
            await page.waitForFunction(() => document.getElementById('checkout-status').textContent.includes('Podés reintentar'));
            assert.equal(await page.$eval('#btn-confirm-pay', el => el.disabled), false);
            const retryKey = payload.idempotency_key;
            const count = writes;
            mode = 'success';
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded'}), page.$eval('#btn-confirm-pay', button => button.click())]);
            assert.equal(writes, count + 1);
            assert.equal(payload.idempotency_key, retryKey, 'Lost responses must retry with the same order key');
            await open();
            await page.$eval('#btn-next-step', button => button.click());
            mode = 'expired';
            await Promise.all([page.waitForNavigation({waitUntil: 'domcontentloaded'}), page.$eval('#btn-confirm-pay', button => button.click())]);
            assert.equal(new URL(page.url()).pathname, '/login.html');
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Desktop/mobile checkout: validation, review, duplicate-submit protection, changed cart, rejected order, unknown result, expired session, authoritative zero total and WhatsApp confirmation passed. No real orders/emails.');
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
