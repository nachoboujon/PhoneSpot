const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Listen to console logs
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
        
        await page.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'networkidle0' });
        
        const banners = await page.$eval('.carousel-container', el => el.innerHTML);
        console.log('BANNERS HTML LENGTH:', banners.length);
        
        const products = await page.$eval('#offers-container', el => el.innerHTML);
        console.log('PRODUCTS HTML LENGTH:', products.length);
        
        await browser.close();
    } catch(e) {
        console.error('PUPPETEER ERROR:', e);
        process.exit(1);
    }
})();
