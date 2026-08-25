const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Starting puppeteer test...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        await page.goto('http://localhost:3000/carrito.html', { waitUntil: 'networkidle0' });
        console.log('Opened carrito');
        
        await page.evaluate(() => {
            localStorage.setItem('phoneSpotCart', JSON.stringify([{
                id: 1, name: 'Test', price: 100, quantity: 1, image_url: ''
            }]));
        });
        
        await page.goto('http://localhost:3000/checkout.html', { waitUntil: 'networkidle0' });
        console.log('Opened checkout');
        
        await page.evaluate(() => {
            document.getElementById('chk-email').value = 'test@test.com';
            document.getElementById('chk-name').value = 'Test';
            document.getElementById('chk-lastname').value = 'Test';
            if (document.getElementById('chk-dni')) document.getElementById('chk-dni').value = '12345678';
            if (document.getElementById('chk-phone')) document.getElementById('chk-phone').value = '12345678';
            document.getElementById('chk-zip').value = '3280';
            document.getElementById('chk-zip').dispatchEvent(new Event('input'));
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        await page.evaluate(() => {
            document.getElementById('chk-address').value = 'Test 123';
            if (document.getElementById('btn-next-step')) document.getElementById('btn-next-step').click();
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Submitting form...');
        await page.evaluate(() => {
            document.getElementById('btn-confirm-pay').click();
        });
        
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log('Test complete');
    } catch (e) {
        console.log('Puppeteer failed:', e);
    }
})();
