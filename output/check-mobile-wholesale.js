const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const settings = require('../public/data/settings.json');
const fs = require('node:fs');
const path = require('node:path');
const server = require('node:http').createServer((req,res) => {
    const pathname = new URL(req.url,'http://localhost').pathname;
    const file = path.join(__dirname,'../public', pathname === '/' ? 'index.html' : pathname);
    fs.readFile(file,(error,data) => {
        if (error) {res.writeHead(404); return res.end();}
        res.setHeader('Content-Type',file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
        res.end(data);
    });
});
const products = ['celulares', 'notebooks', 'tablets', 'audio', 'relojes', 'consolas'].map((category, index) => ({id: 90001 + index, name: category === 'celulares' ? 'Samsung Galaxy A56 256GB' : 'Producto ' + category, category, brand: 'Samsung', price: 100, stock: 20, image_url: '/uploads/hero-graphite-phone-v2.jpg', variants: [], images: []}));
(async () => {
    await new Promise(resolve => server.listen(3000,'127.0.0.1',resolve));
    const browser = await puppeteer.launch({headless: true});
    try {
        for (const width of [390, 320, 768, 1440]) {
            const page = await browser.newPage();
            await page.setViewport({width, height: 850});
            await page.evaluateOnNewDocument(() => localStorage.setItem('cookies_accepted', 'true'));
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = new URL(request.url());
                if (!url.pathname.startsWith('/api/')) return request.continue();
                let body = [];
                if (url.pathname === '/api/settings') body = settings;
                if (url.pathname === '/api/dollar-rate') body = {rate: 1400};
                if (url.pathname === '/api/products') body = products;
                if (url.pathname.startsWith('/api/products/')) body = products[0];
                return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
            });
            for (const route of ['/index.html', '/catalogo.html?cat=all', '/producto.html?id=90001', '/carrito.html']) {
                await page.goto('http://localhost:3000' + route, {waitUntil: 'networkidle2'});
                await page.waitForSelector('#social-dock');
                const layout = await page.evaluate(() => {
                    const dock = document.getElementById('social-dock');
                    return {position: getComputedStyle(dock).position, footer: !!dock.closest('footer'), overflow: document.documentElement.scrollWidth > innerWidth, offenders: [...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.left>=0 && r.right>innerWidth+1 && getComputedStyle(el).position!=='fixed';}).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width})).slice(0,12), columns: getComputedStyle(document.querySelector('#full-catalog-container') || document.body).gridTemplateColumns, header: document.querySelector('header').getBoundingClientRect().toJSON()};
                });
                console.log(width, route, JSON.stringify(layout));
                if (process.argv.includes('--before')) {
                    if (width === 390 && route === '/index.html') await page.screenshot({path: 'output/mobile-before.png'});
                } else {
                    assert.equal(layout.position, width <= 768 ? 'static' : 'fixed');
                    assert.ok(layout.footer);
                    if (layout.overflow) process.exitCode = 1;
                    if (width === 390 && route === '/index.html') await page.screenshot({path: 'output/mobile-after.png'});
                    if (width === 1440 && route === '/index.html') await page.screenshot({path: 'output/desktop-after.png'});
                }
            }
            await page.close();
        }
    } finally { await browser.close(); server.close(); }
})().catch(error => {console.error(error); server.close(); process.exitCode = 1;});
