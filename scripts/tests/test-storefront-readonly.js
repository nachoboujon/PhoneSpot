// Browser audit: public reads only; cart, accounts, events and orders use fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const output = process.env.AUDIT_OUTPUT || path.resolve(__dirname, '../../artifacts/audit/storefront-2026-10-01');

async function main() {
    const [products, settings, rate] = await Promise.all(['/api/products', '/api/settings', '/api/dollar-rate'].map(async route => {
        const response = await fetch(base + route);
        assert.ok(response.ok, `${route}: ${response.status}`);
        return response.json();
    }));
    const phone = products.find(product => product.name === 'iPhone 14 Pro') || products[0];
    assert.ok(phone, 'Public catalog must contain products');
    const user = {id: 999999, name: 'Cliente de prueba', email: 'audit@example.invalid', phone: '3447416011'};
    const item = {id: String(phone.id), name: phone.name, price: Number(phone.price), quantity: 1,
        img: phone.image_url, category: phone.category, variant_name: '', expires_at: new Date(Date.now() + 86400000).toISOString()};
    const browser = await puppeteer.launch({headless: true});
    const findings = [];
    fs.mkdirSync(output, {recursive: true});
    try {
        for (const route of (process.env.AUDIT_ROUTES ? process.env.AUDIT_ROUTES.split(',') : ['index.html', 'catalogo.html', `producto.html?id=${phone.id}`, 'producto.html?id=999999999',
            'carrito.html', 'checkout.html', 'checkout.html?expired=1', 'perfil.html', 'perfil.html?unavailable=1', 'perfil.html?expired=1', 'comparar.html', 'login.html', 'register.html',
            'recuperar.html', 'restablecer.html', 'garantias.html', 'terminos.html', 'admin.html', 'admin.html?fixture=1', 'compra-exitosa.html'])) {
            const page = await browser.newPage();
            const errors = [];
            const settingsWrites = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.evaluateOnNewDocument(() => {
                localStorage.setItem('cookies_accepted', 'true');
                localStorage.setItem('phoneSpotToken', 'audit-fixture');
                localStorage.setItem('phoneSpotRole', 'client');
            });
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                const reply = (body, status = 200) => request.respond({status, contentType: 'application/json', body: JSON.stringify(body)});
                if (url.origin !== new URL(base).origin) return request.continue();
                const api = url.pathname;
                if (api === '/api/products') return reply(products);
                if (api.startsWith('/api/products/')) {
                    const product = products.find(entry => String(entry.id) === api.split('/').pop());
                    return product ? reply(product) : reply({error: 'Producto no encontrado'}, 404);
                }
                if (api === '/api/settings') {
                    if (request.method() === 'POST') {
                        settingsWrites.push(JSON.parse(request.postData()));
                        return reply({message: 'Fixture: settings saved'});
                    }
                    return reply(route.includes('fixture=1') ? {...settings, shipping_correo: 0, shipping_andreani: 0, free_shipping_threshold: 0} : settings);
                }
                if (api === '/api/dollar-rate') return reply(rate);
                if (api.startsWith('/api/reviews/')) return reply([]);
                if (api.startsWith('/api/cart/')) return reply(route.startsWith('checkout.html') ? [item] : []);
                if (api === '/api/me') {
                    if (route.includes('expired=1')) return reply({error: 'La sesión venció'}, 401);
                    if (route.includes('unavailable=1')) return reply({error: 'Error temporal'}, 500);
                    return reply(user);
                }
                if (api === '/api/my-orders') return reply([{id: 123, total: 123.45, status: 'pending', created_at: '2026-10-01T12:00:00Z', order_items: []}]);
                if (api === '/api/register' && route === 'register.html') return reply({message: 'Fixture: email verification requested'}, 201);
                if (api === '/api/admin/session') return route.includes('fixture=1') ? request.respond({status: 204}) : reply({error: 'Se requiere rol de administrador'}, 403);
                if (api === '/api/orders' || api === '/api/admin/reviews') return reply([]);
                if (api === '/api/admin/analytics') return reply({page_views: 0, add_to_cart: 0, checkout_started: 0, product_views: {}});
                if (api === '/api/auth/google/config') return reply({enabled: false});
                if (request.method() !== 'GET') return reply({error: 'Mutation blocked by read-only audit'}, api === '/api/events' ? 200 : 405);
                return request.continue();
            });
            await page.setViewport({width: 1440, height: 900});
            await page.goto(`${base}/${route}`, {waitUntil: 'domcontentloaded'});
            await page.waitForNetworkIdle({idleTime: 300, timeout: 4000}).catch(() => {});
            const scan = () => page.evaluate(() => ({
                overflow: document.documentElement.scrollWidth > innerWidth,
                duplicateIds: [...new Set([...document.querySelectorAll('[id]')].map(el => el.id))].filter(id => document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length > 1),
                brokenImages: [...document.images].filter(img => img.complete && !img.naturalWidth && img.getBoundingClientRect().width > 0).map(img => img.getAttribute('src')),
                title: document.title
            }));
            const desktop = await scan();
            if (['index.html', 'catalogo.html', `producto.html?id=${phone.id}`].includes(route)) await page.screenshot({path: path.join(output, route.split('.')[0] + '-desktop.png')});
            await page.setViewport({width: 390, height: 844});
            const mobile = await scan();
            if (route === 'admin.html?fixture=1') {
                assert.equal(await page.evaluate(() => document.documentElement.classList.contains('admin-verified')), true);
                await page.screenshot({path: path.join(output, 'admin-mobile.png')});
                for (const tab of ['tab-products', 'tab-orders', 'tab-reviews', 'tab-stats', 'tab-design']) {
                    await page.click(`.admin-nav a[onclick*="${tab}"]`);
                    assert.equal(await page.$eval('.admin-section.active', el => el.id), tab);
                }
                assert.equal(await page.$eval('#admin-whatsapp-form', el => el.closest('.admin-section').id), 'tab-design');
                assert.equal(await page.$eval('#set-ship-correo', el => el.value), '0');
                const submit = async selector => {
                    const saved = page.waitForResponse(response => response.url().endsWith('/api/settings') && response.request().method() === 'POST');
                    await page.$eval(selector, form => form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})));
                    await saved;
                };
                await submit('#admin-shipping-form');
                assert.equal(settingsWrites.at(-1).shipping_correo, 0);
                assert.equal(settingsWrites.at(-1).free_shipping_threshold, 0);
                await page.$eval('#set-whatsapp-num', el => {el.value = '5493447416011';});
                await submit('#admin-whatsapp-form');
                assert.equal(settingsWrites.at(-1).whatsapp_number, '5493447416011');
                await page.$eval('#add-coupon-code', el => {el.value = 'AUDIT';});
                await submit('#admin-coupon-form');
                assert.ok(settingsWrites.at(-1).coupons.some(coupon => coupon.code === 'AUDIT'));
                await page.screenshot({path: path.join(output, 'admin-design-mobile.png')});
            }
            if (route.includes('expired=1')) assert.equal(new URL(page.url()).pathname, '/login.html', 'An expired account must return to login');
            if (route.includes('unavailable=1')) {
                assert.equal(new URL(page.url()).pathname, '/perfil.html');
                assert.equal(await page.evaluate(() => localStorage.getItem('phoneSpotToken')), 'audit-fixture', 'A connection failure must not log out the account');
            }
            if (route === 'perfil.html') assert.match(await page.$eval('.order-total strong', el => el.textContent), /^USD 123,45$/);
            if (route === 'index.html') {
                await page.evaluate(id => {localStorage.setItem('phoneSpotFavs', JSON.stringify([id])); return window.loadSidebarFavorites();}, String(phone.id));
                assert.equal(await page.$('#fav-sidebar-items .add-to-cart-btn'), null, 'Favorites must open the product to select a variant');
                assert.equal(new URL(await page.$eval('#fav-sidebar-items a.btn', el => el.getAttribute('href')), base).searchParams.get('id'), String(phone.id));
                await page.evaluate(() => showToast('<img id="audit-toast-injected" src="x">'));
                assert.equal(await page.$('#audit-toast-injected'), null, 'Toast messages must remain text');
            }
            if (route === 'register.html') {
                await page.evaluate(() => {
                    document.querySelector('#reg-name').value = '<img id="audit-register-injected" src="x">';
                    document.querySelector('#reg-email').value = 'audit@example.invalid';
                    document.querySelector('#reg-password').value = 'StrongPassword123';
                    document.querySelector('#register-form').dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
                });
                await page.waitForSelector('.auth-form-wrapper h2');
                await page.waitForFunction(() => document.querySelector('.auth-form-wrapper h2')?.textContent.includes('Casi listo'));
                assert.equal(await page.$('#audit-register-injected'), null, 'Registration confirmation must escape user input');
            }
            if (route.startsWith('producto.html?id=') && !route.includes('999999999')) {
                const colors = await page.$$eval('.var-btn[data-type="color"]', buttons => buttons.map(button => button.dataset.val));
                for (const color of colors) {
                    await page.$eval(`.var-btn[data-type="color"][data-val="${color}"]`, button => button.click());
                    const gallery = await page.$$eval('.gallery-thumb', buttons => buttons.map(button => ({color: button.dataset.color, url: button.dataset.image})));
                    assert.ok(gallery.every(photo => !photo.color || photo.color === color), 'Gallery contains another color');
                    assert.equal(new Set(gallery.map(photo => photo.url)).size, gallery.length, 'Repeated gallery URLs');
                }
            }
            if (route === 'checkout.html') {
                await page.evaluate(() => {window.currentCoupon = {type: 'fixed', value: 999999}; renderCheckout();});
                const total = await page.$eval('#checkout-total', el => el.textContent);
                assert.equal(total, '$0', 'A coupon must not make the checkout total negative');
                findings.push({route, excessiveCouponTotal: total});
            }
            assert.deepEqual(errors, [], `JavaScript errors in ${route}`);
            assert.equal(desktop.overflow, false, `Desktop horizontal overflow in ${route}`);
            assert.equal(mobile.overflow, false, `Mobile horizontal overflow in ${route}`);
            findings.push({route, finalPath: new URL(page.url()).pathname, errors, desktop, mobile});
            await page.close();
        }
        const receipt = await browser.newPage();
        const invalid = new URLSearchParams({orderId: '<img id="audit-injected" src="x">', wpUrl: 'javascript:alert(1)', total: '-100'});
        await receipt.goto(`${base}/compra-exitosa.html?${invalid}`, {waitUntil: 'domcontentloaded'});
        assert.equal(await receipt.$('#audit-injected'), null, 'Receipt must not interpret URL input as HTML');
        assert.equal(await receipt.$eval('#wp-action-container', el => getComputedStyle(el).display), 'none', 'Unsafe WhatsApp link must be hidden');
        await receipt.goto(`${base}/compra-exitosa.html?${new URLSearchParams({orderId: '123', total: '100', wpUrl: 'https://wa.me/5493447416011?text=Hola'})}`, {waitUntil: 'domcontentloaded'});
        assert.match(await receipt.$eval('#order-message', el => el.textContent), /#123/);
        assert.equal(await receipt.$eval('#wp-btn', el => new URL(el.href).hostname), 'wa.me');
        await receipt.close();
        const publicDir = path.resolve(__dirname, '../../public');
        const missingResources = [];
        for (const file of fs.readdirSync(publicDir).filter(name => name.endsWith('.html'))) {
            const html = fs.readFileSync(path.join(publicDir, file), 'utf8');
            for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
                const href = match[1];
                if (!href || /^(https?:|#|data:|javascript:|mailto:|tel:)/.test(href) || href.includes('${')) continue;
                const resource = href.split(/[?#]/)[0];
                if (resource && !fs.existsSync(path.join(publicDir, resource))) missingResources.push({file, resource});
            }
        }
        findings.push({missingResources});
        fs.writeFileSync(path.join(output, process.env.AUDIT_ROUTES ? 'results-focused.json' : 'results.json'), JSON.stringify(findings, null, 2));
        console.log(JSON.stringify(findings.map(({route, errors, desktop, mobile, excessiveCouponTotal}) => ({route, errors,
            desktopOverflow: desktop?.overflow, mobileOverflow: mobile?.overflow, duplicateIds: desktop?.duplicateIds,
            brokenImages: desktop?.brokenImages?.length, excessiveCouponTotal})), null, 2));
    } finally {await browser.close();}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
