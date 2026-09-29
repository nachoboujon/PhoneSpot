const puppeteer = require('../node_modules/puppeteer');
const assert = require('node:assert/strict');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  for (const route of ['/', '/catalogo.html?cat=celulares', '/carrito.html']) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#social-dock .social-dock__whatsapp');
    const result = await page.evaluate(() => {
      const links = [...document.querySelectorAll('#social-dock a')];
      const boxes = links.map(link => link.getBoundingClientRect().toJSON());
      return { count: links.length, hrefs: links.map(link => link.href), stacked: boxes[0].bottom < boxes[1].top, rightAligned: Math.abs(boxes[0].right - boxes[1].right) < 1 };
    });
    assert.equal(result.count, 2);
    assert(result.stacked && result.rightAligned);
    assert(result.hrefs[0].includes('instagram.com/phonespotsj'));
    assert(result.hrefs[1].includes('wa.me/'));
    console.log(route, result);
  }
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
