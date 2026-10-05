const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const server = http.createServer((req,res) => {
    const route = new URL(req.url, 'http://localhost').pathname;
    if (route.startsWith('/api/')) {
        res.setHeader('Content-Type','application/json');
        return res.end(JSON.stringify(route === '/api/dollar-rate' ? {rate:1400} : route === '/api/settings' ? {} : []));
    }
    const file = path.join(__dirname, '../public', route);
    fs.readFile(file, (error,data) => {
        if (error) {res.writeHead(404);return res.end();}
        res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(3012,'127.0.0.1',resolve));
    const browser = await puppeteer.launch({headless:true});
    try {
        const page = await browser.newPage();
        await page.evaluateOnNewDocument(() => localStorage.setItem('cookies_accepted','true'));
        for (const width of [390,1440]) {
            await page.setViewport({width,height:850});
            await page.goto('http://127.0.0.1:3012/index.html', {waitUntil:'networkidle2'});
            const report = () => page.evaluate(() => {
                const button = document.querySelector('.menu-toggle');
                const css = getComputedStyle(button);
                return {links:[...document.querySelectorAll('.header-icons a')].map(a=>({title:a.title,decoration:getComputedStyle(a).textDecorationLine})),menu:{expanded:button.getAttribute('aria-expanded'),background:css.backgroundColor,color:css.color,shadow:css.boxShadow,transform:css.transform}};
            });
            console.log(width,'closed',await report());
            if (width === 390) {
                await page.tap('#mobile-menu-btn');
                await new Promise(resolve => setTimeout(resolve,220));
                console.log(width,'open',await report());
                await page.screenshot({path:'output/header-menu-open.png'});
                await page.tap('#mobile-menu-btn');
                await new Promise(resolve => setTimeout(resolve,220));
                console.log(width,'closed again',await report());
                await page.screenshot({path:'output/header-mobile.png'});
            }
        }
    } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
