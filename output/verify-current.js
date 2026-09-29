const puppeteer = require('../node_modules/puppeteer');
const assert = require('node:assert/strict');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let cartId;
  let variantName;
  try {
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'output/playwright/business-hero-mobile.png' });
    console.log('home', await page.evaluate(() => ({ hero: document.querySelector('.business-hero__copy h2')?.innerText, banner: document.querySelector('.scrolling-text')?.innerText, overflow: document.documentElement.scrollWidth > innerWidth })));

    await page.goto('http://localhost:3000/producto.html?id=73', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.gallery-thumb');
    console.log('product', await page.evaluate(() => ({ thumbs: document.querySelectorAll('.gallery-thumb').length, note: document.querySelector('#photo-color-note')?.innerText, broken: [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.src) })));

    await page.goto('http://localhost:3000/catalogo.html?cat=celulares', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.product-card[data-id="73"]');
    const before = await page.$eval('.product-card[data-id="73"] .card-variant-stock', el => el.innerText);
    cartId = await page.evaluate(() => localStorage.getItem('phoneSpotCartId'));
    await page.evaluate(() => document.querySelector('.product-card[data-id="73"] .add-to-cart-btn').click());
    await page.waitForFunction(before => document.querySelector('.product-card[data-id="73"] .card-variant-stock')?.innerText !== before, {}, before);
    const after = await page.$eval('.product-card[data-id="73"] .card-variant-stock', el => el.innerText);
    console.log('stock', { before, after, cartId });
    const reservation = await page.evaluate(() => ({ side: document.querySelector('#side-cart .cart-reservation-notice')?.innerText, count: document.querySelector('#cart-count-badge')?.innerText }));
    console.log('side cart', reservation);
    assert.match(reservation.side || '', /24 horas/);
    const cart = await (await page.evaluate(async cartId => (await fetch(`/api/cart/${cartId}`)).json(), cartId));
    variantName = cart.find(item => Number(item.id) === 73)?.variant_name;
    await page.goto('http://localhost:3000/carrito.html', { waitUntil: 'networkidle2' });
    console.log('full cart', await page.evaluate(() => document.querySelector('#cart-items .cart-reservation-notice')?.innerText || [...document.querySelectorAll('.cart-reservation-notice')].map(el => el.innerText)));
    console.log('errors', errors);
    assert.equal(errors.length, 0);
  } finally {
    if (cartId && variantName !== undefined) {
      await page.evaluate(async ({ cartId, variantName }) => fetch(`/api/cart/${cartId}/items`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: 73, variant_name: variantName, quantity: 0 }) }), { cartId, variantName }).catch(console.error);
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
