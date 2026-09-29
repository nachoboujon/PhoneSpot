const puppeteer = require('../node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.evaluateOnNewDocument(() => {
    window.__lcp = 0;
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    await page.setViewport({ width, height });
    await page.goto('http://localhost:3000/catalogo.html?cat=celulares', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#full-catalog-container .product-card', { timeout: 20000 });
    await page.evaluate(() => { localStorage.setItem('phoneSpotCookieConsent', 'accepted'); document.querySelectorAll('.cookie-banner, #cookie-banner').forEach(el => el.remove()); });
    if (name === 'desktop') await page.evaluate(() => scrollTo(0, 300));
    if (name === 'mobile') await page.evaluate(() => scrollTo(0, document.querySelector('#full-catalog-container').getBoundingClientRect().top + scrollY - 130));
    await page.screenshot({ path: `output/playwright/catalog-audit-${name}.png` });
    console.log(name, await page.evaluate(() => ({
      count: document.querySelectorAll('#full-catalog-container .product-card').length,
      width: document.documentElement.scrollWidth,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: window.__lcp,
      resources: performance.getEntriesByType('resource').length,
      decodedKB: Math.round(performance.getEntriesByType('resource').reduce((sum, r) => sum + r.decodedBodySize, 0) / 1024),
      firstCard: (() => { const c = document.querySelector('#full-catalog-container .product-card'); const img = c?.querySelector('img'); return c && { width: c.clientWidth, height: c.clientHeight, imageHeight: img?.clientHeight, imageNaturalHeight: img?.naturalHeight }; })(),
      broken: [...document.images].filter(img => img.complete && !img.naturalWidth).length
    })));
  }
  console.log('failures', failures);
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
