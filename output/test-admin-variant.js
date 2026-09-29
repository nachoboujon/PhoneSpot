const puppeteer = require('../node_modules/puppeteer');
const assert = require('node:assert/strict');

(async () => {
  const product = await (await fetch('http://localhost:3000/api/products/73')).json();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const puts = [];
  await page.evaluateOnNewDocument(() => { localStorage.setItem('phoneSpotToken', 'mock-admin-token'); localStorage.setItem('phoneSpotRole', 'admin'); });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/admin/session') return request.respond({ status: 200, contentType: 'application/json', body: '{}' });
    if (url.pathname === '/api/products' && request.method() === 'GET') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([product]) });
    if (url.pathname === '/api/products/73' && request.method() === 'PUT') {
      puts.push(JSON.parse(request.postData()));
      return request.respond({ status: 200, contentType: 'application/json', body: '{"message":"Producto actualizado"}' });
    }
    request.continue();
  });
  try {
    await page.goto('http://localhost:3000/admin.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#variants-edit-73');
    await page.evaluate(() => window.toggleVariantsEdit(73));
    await page.waitForSelector('#edit-vprice-73-0');
    const prior = await page.$eval('#edit-vprice-73-0', el => el.value);
    await page.$eval('#edit-vprice-73-0', el => { el.value = '0'; });
    await page.evaluate(async () => window.updateVariantDetails(73, 0));
    assert.equal(puts.length, 0, 'Precio inválido no debe enviarse');
    await page.$eval('#edit-vprice-73-0', el => { el.value = '777'; });
    await page.evaluate(async () => window.updateVariantDetails(73, 0));
    assert.equal(puts.length, 1);
    assert.equal(puts[0].variants[0].price, 777);
    assert.equal(puts[0].variants[0].stock, product.variants[0].stock);
    assert.equal(puts[0].variants[0].image_url, product.variants[0].image_url);
    console.log({ prior, changed: puts[0].variants[0].price, variantCount: puts[0].variants.length, stock: puts[0].stock, invalidBlocked: true });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
