// Isolated admin price edit: no real database or email writes.
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'variant-photos-fixture-secret';
const product = {id: 73, name: 'Equipo de prueba', stock: 10, variants: [{color: 'Negro', capacity: '256GB',
    ram: '8GB', condition: 'Nuevo sellado', price: 100, stock: 10,
    image_url: '/front.webp', images: ['/front.webp', '/back.webp'], color_hex: '#121212'}]};
product.stock = 20;
product.variants[0].configuration = 'Intel Core i5';
product.variants.push({...product.variants[0], configuration: 'Intel Core i7 · Pantalla táctil', price: 200, image_url: '/i7-front.webp', images: ['/i7-front.webp', '/i7-back.webp']});
const query = table => {
    let patch;
    const chain = {
        select() {return chain;}, eq() {return chain;}, is() {return chain;},
        update(value) {patch = value; return chain;},
        single: async () => ({data: structuredClone(product), error: null}),
        then(resolve, reject) {
            if (table === 'stock_alerts') return Promise.resolve({data: [], error: null}).then(resolve, reject);
            assert.equal(table, 'products');
            Object.assign(product, patch);
            return Promise.resolve({data: [structuredClone(product)], error: null}).then(resolve, reject);
        }
    };
    return chain;
};
const modulePath = require.resolve('@supabase/supabase-js');
require.cache[modulePath] = {id: modulePath, filename: modulePath, loaded: true, exports: {createClient: () => ({from: query})}};
const app = require('../../server');
async function main() {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const token = jwt.sign({id: 999, role: 'admin'}, process.env.JWT_SECRET, {issuer: 'phonespot', audience: 'phonespot-web'});
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/products/73`, {
            method: 'PUT', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
            body: JSON.stringify({variants: product.variants.map((v, i) => ({color:v.color, capacity:v.capacity, ram:v.ram, condition:v.condition, configuration:v.configuration, price:i ? 260 : 140, stock:10}))})
        });
        assert.equal(response.status, 200);
        assert.equal(product.variants[0].price, 140);
        assert.equal(product.variants[0].image_url, '/front.webp');
        assert.deepEqual(product.variants[0].images, ['/front.webp', '/back.webp']);
        assert.equal(product.variants[0].color_hex, '#121212');
        assert.equal(product.variants[1].price, 260);
        assert.equal(product.variants[1].image_url, '/i7-front.webp');
        assert.deepEqual(product.variants[1].images, ['/i7-front.webp', '/i7-back.webp']);
        assert.equal(product.variants[1].configuration, 'Intel Core i7 · Pantalla táctil');
        console.log('Admin notebook configuration price edit preserves the official photo gallery and color. No external writes.');
    } finally {await new Promise(resolve => server.close(resolve));}
}
main().catch(error => {console.error(error); process.exitCode = 1;});
