const puppeteer = require('../node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000/?preview=hero-redesign', { waitUntil: 'networkidle2' });
    await page.evaluate(() => { localStorage.setItem('phoneSpotCookieConsent', 'accepted'); document.querySelectorAll('.cookie-banner, #cookie-banner').forEach(el => el.remove()); });
    await page.screenshot({ path: `output/playwright/hero-redesign-${name}.png` });
    console.log(name, await page.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > innerWidth, hero: document.querySelector('.business-hero').getBoundingClientRect().toJSON(), links: [...document.querySelectorAll('.business-hero a')].map(a => ({ label: a.innerText.trim(), href: a.getAttribute('href') })) })));
  }
  await browser.close();
})().catch(err => { console.error(err); process.exitCode = 1; });
