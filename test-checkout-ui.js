const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        await page.goto('http://localhost:3000/carrito.html', { waitUntil: 'networkidle0' });
        
        // Add a mock product to cart and go to checkout
        await page.evaluate(() => {
            localStorage.setItem('phoneSpotCart', JSON.stringify([{
                id: 1, name: 'Test', price: 100, quantity: 1, image_url: ''
            }]));
        });
        
        await page.goto('http://localhost:3000/checkout.html', { waitUntil: 'networkidle0' });
        
        // Fill form
        await page.evaluate(() => {
            document.getElementById('chk-email').value = 'test@test.com';
            document.getElementById('chk-name').value = 'Test';
            document.getElementById('chk-lastname').value = 'Test';
            document.getElementById('chk-dni').value = '12345678';
            document.getElementById('chk-phone').value = '12345678';
            document.getElementById('chk-zip').value = '3280';
            
            // Dispatch input event to trigger zip code logic
            document.getElementById('chk-zip').dispatchEvent(new Event('input'));
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        await page.evaluate(() => {
            document.getElementById('chk-address').value = 'Test 123';
            document.getElementById('btn-next-step').click(); // Go to step 2
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Clicking submit...');
        await page.evaluate(() => {
            const form = document.getElementById('checkout-form');
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        });
        
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
    } catch (e) {
        console.log('Puppeteer failed:', e);
    }
})();
