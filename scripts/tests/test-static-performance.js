const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const puppeteer = require('puppeteer');
const base = process.env.AUDIT_URL || 'http://localhost:3000';
const publicDir = path.resolve(__dirname, '../../public');

function get(route, headers = {}) {
    return new Promise((resolve, reject) => {
        http.get(base + route, {headers}, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    const results = [];
    for (const file of ['index.html', 'script.js', 'style.css']) {
        const original = await get('/' + file, {'Accept-Encoding': 'identity'});
        assert.equal(original.status, 200);
        for (const encoding of ['gzip', 'br']) {
            const compressed = await get('/' + file, {'Accept-Encoding': encoding});
            assert.equal(compressed.headers['content-encoding'], encoding);
            assert.match(compressed.headers.vary, /Accept-Encoding/i);
            const decoded = encoding === 'br' ? zlib.brotliDecompressSync(compressed.body) : zlib.gunzipSync(compressed.body);
            assert.deepEqual(decoded, original.body, 'Compression must preserve the complete response');
            assert.ok(compressed.body.length < original.body.length * 0.5, `${file} must save at least 50%`);
            results.push({file, encoding, originalBytes: original.body.length, transferredBytes: compressed.body.length,
                savedPercent: Number((100 * (1 - compressed.body.length / original.body.length)).toFixed(1))});
        }
        const cached = await get('/' + file, {'If-None-Match': original.headers.etag});
        assert.equal(cached.status, 304);
        assert.equal(cached.body.length, 0);
        assert.match(original.headers['cache-control'], /max-age=0/);
    }
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
    const scriptUrl = html.match(/src="(script\.js\?v=[^"]+)"/)[1];
    assert.match((await get('/' + scriptUrl)).headers['cache-control'], /max-age=86400/);
    assert.equal((await get('/api/performance-not-found')).headers['cache-control'], 'no-store');
    for (const kind of ['phone', 'laptop', 'accessories']) {
        const jpg = await get(`/uploads/hero-graphite-${kind}-v2.jpg`);
        assert.equal(jpg.status, 200);
        assert.match(jpg.headers['cache-control'], /max-age=86400/);
        assert.equal((await get(`/uploads/hero-graphite-${kind}-v1.png`)).status, 200);
    }

    const browser = await puppeteer.launch({headless: true});
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewport({width: 390, height: 844});
        const settings = JSON.parse(fs.readFileSync(path.join(publicDir, 'data/settings.json'), 'utf8'));
        // Reproduce saved legacy settings without changing the real store.
        settings.carousel.forEach(slide => {slide.image = slide.image.replace('-v2.jpg', '-v1.png');});
        await page.setRequestInterception(true);
        page.on('request', request => {
            const url = new URL(request.url());
            if (url.origin === new URL(base).origin && url.pathname.startsWith('/api/')) {
                const body = url.pathname === '/api/settings' ? settings : url.pathname === '/api/dollar-rate' ? {rate: 1400} : [];
                return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
            }
            return request.continue();
        });
        await page.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
        await page.waitForSelector('.carousel-slide');
        await page.$eval('#inicio', section => section.scrollIntoView());
        await page.waitForFunction(() => document.querySelector('.carousel-slide.active')?.dataset.imageLoaded === 'true');
        for (let index = 0; index < 3; index++) {
            const url = await page.$eval('.carousel-slide.active', slide => slide.dataset.image);
            assert.match(url, /-v2\.jpg$/);
            assert.equal(await page.evaluate(url => new Promise(resolve => {
                const image = new Image(); image.onload = () => resolve(image.naturalWidth > 0);
                image.onerror = () => resolve(false); image.src = url;
            }), url), true, 'Banner must decode correctly');
            await page.click('.carousel-next');
        }
        await page.$eval('#inicio', section => {section.style.marginTop = '3000px';});
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForFunction(() => document.getElementById('inicio').getBoundingClientRect().top > innerHeight + 200);
        await new Promise(resolve => setTimeout(resolve, 150));
        const slideBefore = await page.$eval('.carousel-slide.active', slide => slide.dataset.image);
        await new Promise(resolve => setTimeout(resolve, 5200));
        assert.equal(await page.$eval('.carousel-slide.active', slide => slide.dataset.image), slideBefore, 'Hidden carousel must pause');
        assert.deepEqual(errors, []);
    } finally {await browser.close();}
    console.log(JSON.stringify({compression: results, cache: 'passed', legacyBanners: 'passed', carousel: 'passed'}, null, 2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
