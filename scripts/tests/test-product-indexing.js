// HTTP regression tests with an isolated database. No production writes.
const assert = require('node:assert/strict');
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'indexing-test-only';
const product = {id: 120, name: 'iPhone <17>', description: 'Pantalla y cámaras & garantía', price: 500, stock: 4, variants: [
    {color: 'Negro', condition: 'Americano', stock: 2, price: 500},
    {color: 'Azul', condition: 'Garantía oficial de Apple', stock: 2, price: 650}
]};
let outage = false;
function from() {
    let id, start;
    const query = {};
    for (const method of ['select', 'is', 'order']) query[method] = () => query;
    query.eq = (_, value) => { id = Number(value); return query; };
    query.range = (value) => { start = value; return query; };
    query.maybeSingle = async () => ({data: id === 120 ? product : id === 121 ? {...product, id: 121, archived_at: '2026-10-01'} : null, error: outage ? {message: 'Fixture outage'} : null});
    query.then = resolve => Promise.resolve({data: start === 0 ? Array.from({length: 1000}, (_, i) => ({id: i + 1})) : [{id: 1001}], error: outage ? {message: 'Fixture outage'} : null}).then(resolve);
    return query;
}
const modulePath = require.resolve('@supabase/supabase-js');
require.cache[modulePath] = {id: modulePath, filename: modulePath, loaded: true, exports: {createClient: () => ({from})}};
const {productSeo} = require('../../lib/product-seo');
const app = require('../../server');
(async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    try {
        const canonical = 'https://www.phonespot.site/producto.html?id=120';
        for (const suffix of ['', '&tipo=americano', '&tipo=apple_warranty&variant=Azul%20-%20Cond%3A%20Garant%C3%ADa%20oficial%20de%20Apple']) {
            const response = await fetch(base + '/producto.html?id=120' + suffix);
            assert.equal(response.status, 200);
            assert.equal(response.headers.get('cache-control'), 'no-store');
            const html = await response.text();
            assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'));
            assert.ok(html.includes('data-server-rendered="true"'));
            assert.ok(html.includes('<h1>iPhone &lt;17&gt;</h1>'));
            assert.ok(!html.includes('Cargando producto...'));
            assert.ok(html.includes('<meta name="description"'));
            assert.ok(html.includes('Pantalla y cámaras &amp; garantía'));
            const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
            assert.equal(schema.url, canonical);
            assert.equal(schema.hasVariant.length, 2);
        }
        const variantSeo = productSeo(product, 'apple_warranty', 'Azul - Cond: Garantía oficial de Apple');
        assert.equal(variantSeo.pageUrl, canonical);
        assert.equal(variantSeo.selected.price, 650);
        for (const path of ['/producto.html', '/producto.html?id=abc', '/producto.html?id=9999', '/producto.html?id=121', '/producto.html?id=1&id=2']) {
            const response = await fetch(base + path);
            assert.equal(response.status, 404, path);
            assert.ok((await response.text()).includes('noindex'));
        }
        const obsolete = await fetch(base + '/producto.html?id=120&tipo=obsolete', {redirect: 'manual'});
        assert.equal(obsolete.status, 301);
        assert.equal(obsolete.headers.get('location'), '/producto.html?id=120');
        const home = await fetch(base + '/index.html', {redirect: 'manual'});
        assert.equal(home.status, 301);
        assert.equal(home.headers.get('location'), '/');
        const tracking = await fetch(base + '/index.html?utm_source=google', {redirect: 'manual'});
        assert.equal(tracking.headers.get('location'), '/?utm_source=google');
        const sitemap = await fetch(base + '/sitemap.xml');
        const xml = await sitemap.text();
        assert.equal((xml.match(/<loc>/g) || []).length, 1005, 'Sitemap must paginate past the Supabase row limit');
        assert.ok(xml.includes('producto.html?id=1001'));
        assert.ok(!xml.includes('tipo='));
        assert.ok(!xml.includes('<lastmod>'));
        outage = true;
        assert.equal((await fetch(base + '/producto.html?id=120')).status, 503, 'DB errors must never fall through to an empty 200');
        assert.equal((await fetch(base + '/sitemap.xml')).status, 503);
        console.log('Product indexing: SSR, escaping, canonical variants, real 404s, temporary 503s, redirects and sitemap pagination passed.');
    } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
